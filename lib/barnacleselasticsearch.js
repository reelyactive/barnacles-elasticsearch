/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const elasticsearch = require('elasticsearch');
const Raddec = require('raddec');


const DEFAULT_ELASTICSEARCH_HOST = 'localhost:9200';
const DEFAULT_INDEX = 'raddec';
const DEFAULT_MAPPING_TYPE = '_doc';
const DEFAULT_PRINT_ERRORS = false;


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

    this.host = options.host || DEFAULT_ELASTICSEARCH_HOST;
    this.index = options.index || DEFAULT_INDEX;
    this.mappingType = options.mappingType || DEFAULT_MAPPING_TYPE;
    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;

    this.client = new elasticsearch.Client({ host: self.host });
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
    let esRaddec = raddec.toFlattened();
    esRaddec.timestamp = new Date(esRaddec.timestamp).toISOString();

    self.client.create({
        index: self.index,
        type: self.mappingType,
        id: id,
        body: esRaddec
    }, function(err, response, status) {
      if(err && self.printErrors) {
        console.error('barnacles-elasticsearch error:', err);
      }
    });
  }
}


module.exports = BarnaclesElasticsearch;
