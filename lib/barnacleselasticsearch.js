/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const { Client } = require('@elastic/elasticsearch');
const Raddec = require('raddec');


const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_INDEX = 'raddec';
const DEFAULT_MAPPING_TYPE = '_doc';
const DEFAULT_PRINT_ERRORS = false;
const DEFAULT_RADDEC_OPTIONS = { includePackets: false };


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

    // Fallback for previous Elasticsearch client
    if(options.host && !options.node) {
      options.node = 'http://' + options.host;
    }

    this.node = options.node || DEFAULT_ELASTICSEARCH_NODE;
    this.index = options.index || DEFAULT_INDEX;
    this.mappingType = options.mappingType || DEFAULT_MAPPING_TYPE;
    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;
    this.raddecOptions = options.raddec || DEFAULT_RADDEC_OPTIONS;

    if(options.client) {
      this.client = options.client;
    }
    else {
      this.client = new Client({ node: self.node });
    }
  }

  /**
   * Handle an outbound raddec.
   * @param {Raddec} raddec The outbound raddec.
   */
  handleRaddec(raddec) {
    let self = this;
    let id = raddec.timestamp + '-' + raddec.transmitterId + '-' +
             raddec.transmitterIdType;

    // Create flat raddec and tweak properties for Elasticsearch
    let esRaddec = raddec.toFlattened(self.raddecOptions);
    esRaddec.timestamp = new Date(esRaddec.timestamp).toISOString();

    let params = {
        index: self.index,
        type: self.mappingType,
        id: id,
        body: esRaddec
    };
    self.client.create(params, {}, function(err, result) {
      if(err && self.printErrors) {
        console.error('barnacles-elasticsearch error:', err);
      }
    });
  }
}


module.exports = BarnaclesElasticsearch;
