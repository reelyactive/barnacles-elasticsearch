/**
 * Copyright reelyActive 2019-2025
 * We believe in an open Internet of Things
 */


const { Client } = require('@elastic/elasticsearch');
const Raddec = require('raddec');


const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_ELASTICSEARCH_VERSION = 8;
const DEFAULT_PRINT_ERRORS = false;
const DEFAULT_RADDEC_OPTIONS = { includePackets: false };
const DEFAULT_DYNAMB_OPTIONS = {};
const DEFAULT_SPATEM_OPTIONS = {};
const DEFAULT_EVENTS_TO_STORE = { raddec: DEFAULT_RADDEC_OPTIONS,
                                  dynamb: DEFAULT_DYNAMB_OPTIONS,
                                  spatem: DEFAULT_SPATEM_OPTIONS };
const SUPPORTED_EVENTS = [ 'raddec', 'dynamb', 'spatem' ];
const RADDEC_INDEX = 'raddec';
const DYNAMB_INDEX = 'dynamb';
const SPATEM_INDEX = 'spatem';


/**
 * BarnaclesElasticsearch Class
 * Detects events and writes to Elasticsearch.
 */
class BarnaclesElasticsearch {

  /**
   * BarnaclesElasticsearch constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.esVersion = options.esVersion || DEFAULT_ELASTICSEARCH_VERSION;
    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;
    this.eventsToStore = {};
    let eventsToStore = options.eventsToStore || DEFAULT_EVENTS_TO_STORE;

    for(const event in eventsToStore) {
      let isSupportedEvent = SUPPORTED_EVENTS.includes(event);

      if(isSupportedEvent) {
        self.eventsToStore[event] = eventsToStore[event] ||
                                    DEFAULT_EVENTS_TO_STORE[event];
      }
    }

    // The (provided) Elasticsearch client has already been instantiated
    if(options.client) {
      this.client = options.client;
    }
    // A set of options is provided with which to instantiate the client
    else if(options.clientOptions) {
      this.client = new Client(options.clientOptions);
    }
    // Create client using the provided or default node
    else {
      let node = options.node || DEFAULT_ELASTICSEARCH_NODE;

      // Fallback for legacy Elasticsearch client [DEPRECATED]
      if(options.host && !options.node) {
        node = 'http://' + options.host;
      }

      this.client = new Client({ node: node });
    }
  }

  /**
   * Handle an outbound event.
   * @param {String} name The outbound event name.
   * @param {Object} data The outbound event data.
   */
  handleEvent(name, data) {
    let self = this;
    let isEventToStore = self.eventsToStore.hasOwnProperty(name);

    if(isEventToStore) {
      switch(name) {
        case 'raddec':
          return handleRaddec(self, data);
        case 'dynamb':
          return handleDynamb(self, data);
        case 'spatem':
          return handleSpatem(self, data);
      }
    }
  }

  /**
   * Handle an outbound raddec.  [DEPRECATED]
   * @param {Raddec} raddec The outbound raddec.
   */
  handleRaddec(raddec) {
    handleRaddec(this, raddec);
  }
}


/**
 * Handle the given raddec by storing it in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} raddec The raddec data.
 */
function handleRaddec(instance, raddec) {
  let raddecOptions = instance.eventsToStore['raddec'];

  // Create flat raddec and tweak properties for Elasticsearch
  let esRaddec = raddec.toFlattened(raddecOptions);
  if(!esRaddec.hasOwnProperty('timestamp')) {
    return;
  }
  let esTimestamp = new Date(esRaddec.timestamp).toISOString();

  switch(instance.esVersion) {

    // Elasticsearch 8
    case 8:
      esRaddec['@timestamp'] = esTimestamp;
      return store(instance, { index: RADDEC_INDEX, document: esRaddec });

    // Elasticsearch 7
    case 7:
      esRaddec.timestamp = esTimestamp;
      return store(instance, { index: RADDEC_INDEX, body: esRaddec });
  }
}


/**
 * Handle the given dynamb by storing it in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} dynamb The dynamb data.
 */
function handleDynamb(instance, dynamb) {
  let dynambOptions = instance.eventsToStore['dynamb'];

  // Tweak dynamb properties for Elasticsearch
  let esDynamb = Object.assign({}, dynamb);
  let esTimestamp = new Date(dynamb.timestamp).toISOString();

  switch(instance.esVersion) {

    // Elasticsearch 8
    case 8:
      esDynamb['@timestamp'] = esTimestamp;
      return store(instance, { index: DYNAMB_INDEX, document: esDynamb });

    // Elasticsearch 7
    case 7:
      esDynamb.timestamp = esTimestamp;
      return store(instance, { index: DYNAMB_INDEX, body: esDynamb });
  }
}


/**
 * Handle the given spatem by storing it in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} spatem The spatem data.
 */
function handleSpatem(instance, spatem) {
  let spatemOptions = instance.eventsToStore['spatem'];
  let location = { type: "Point" };
  let signature = spatem.deviceId + Raddec.identifiers.SIGNATURE_SEPARATOR +
                  spatem.deviceIdType;

  if(!spatem.hasOwnProperty('data') || !Array.isArray(spatem.data.features)) {
    return;
  }

  // Find the Point which isDevicePosition
  spatem.data.features.forEach((feature) => {
    let isValidPoint = (feature.hasOwnProperty('properties') &&
                        feature.hasOwnProperty('geometry') &&
                        feature.properties.isDevicePosition &&
                        Array.isArray(feature.geometry.coordinates) &&
                        (feature.geometry.coordinates.length >= 2)) ;
    if(isValidPoint) {
      location.coordinates = [ feature.geometry.coordinates[0],
                               feature.geometry.coordinates[1] ]; // 2D only
    }       
  });

  if(!Array.isArray(location.coordinates)) {
    return;
  }

  // Tweak spatem properties for Elasticsearch
  let esSpatem = { text: signature, location: location };
  let esTimestamp = new Date(spatem.timestamp).toISOString();

  switch(instance.esVersion) {

    // Elasticsearch 8 (only)
    case 8:
      esSpatem['@timestamp'] = esTimestamp;
      return store(instance, { index: SPATEM_INDEX, document: esSpatem });
  }
}


/**
 * Store the given record in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} params The parameters of the record to store.
 */
function store(instance, params) {
  instance.client.index(params)
    .catch((err) => {
      if(instance.printErrors) {
        console.error('barnacles-elasticsearch error:', err);
      }
    });
}


module.exports = BarnaclesElasticsearch;
