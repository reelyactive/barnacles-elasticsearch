/**
 * Copyright reelyActive 2019-2021
 * We believe in an open Internet of Things
 */


const { Client } = require('@elastic/elasticsearch');
const Raddec = require('raddec');


const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_MAPPING_TYPE = '_doc';
const DEFAULT_PRINT_ERRORS = false;
const DEFAULT_RADDEC_OPTIONS = { includePackets: false };
const DEFAULT_DYNAMB_OPTIONS = {};
const DEFAULT_EVENTS_TO_STORE = { raddec: DEFAULT_RADDEC_OPTIONS,
                                  dynamb: DEFAULT_DYNAMB_OPTIONS };
const SUPPORTED_EVENTS = [ 'raddec', 'dynamb' ];
const RADDEC_INDEX = 'raddec';
const DYNAMB_INDEX = 'dynamb';


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

    this.eventsToStore = {};
    let eventsToStore = options.eventsToStore || DEFAULT_EVENTS_TO_STORE;

    for(const event in eventsToStore) {
      let isSupportedEvent = SUPPORTED_EVENTS.includes(event);

      if(isSupportedEvent) {
        self.eventsToStore[event] = eventsToStore[event] ||
                                    DEFAULT_EVENTS_TO_STORE[event];
      }
    }

    // Fallback for previous Elasticsearch client
    if(options.host && !options.node) {
      options.node = 'http://' + options.host;
    }

    this.node = options.node || DEFAULT_ELASTICSEARCH_NODE;
    this.mappingType = options.mappingType || DEFAULT_MAPPING_TYPE;
    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;

    if(options.client) {
      this.client = options.client;
    }
    else {
      this.client = new Client({ node: self.node });
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
  let id = raddec.timestamp + '-' + raddec.transmitterId + '-' +
           raddec.transmitterIdType;
  let raddecOptions = instance.eventsToStore['raddec'];

  // Create flat raddec and tweak properties for Elasticsearch
  let esRaddec = raddec.toFlattened(raddecOptions);
  esRaddec.timestamp = new Date(esRaddec.timestamp).toISOString();

  let params = {
      index: RADDEC_INDEX,
      type: instance.mappingType,
      id: id,
      body: esRaddec
  };
  store(instance, params);
}


/**
 * Handle the given dynamb by storing it in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} dynamb The dynamb data.
 */
function handleDynamb(instance, dynamb) {
  let id = dynamb.timestamp + '-' + dynamb.deviceId + '-' +
           dynamb.deviceIdType;
  let dynambOptions = instance.eventsToStore['dynamb'];

  // Tweak dynamb properties for Elasticsearch
  let esDynamb = Object.assign({}, dynamb);
  esDynamb.timestamp = new Date(dynamb.timestamp).toISOString();

  let params = {
      index: DYNAMB_INDEX,
      type: instance.mappingType,
      id: id,
      body: esDynamb
  };
  store(instance, params);
}


/**
 * Store the given record in Elasticsearch.
 * @param {BarnaclesElasticsearch} instance The BarnaclesElasticsearch instance.
 * @param {Object} params The parameters of the record to store.
 */
function store(instance, params) {
  instance.client.create(params, {}, function(err, result) {
    if(err && instance.printErrors) {
      console.error('barnacles-elasticsearch error:', err);
    }
  });
}


module.exports = BarnaclesElasticsearch;
