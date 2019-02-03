/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const elasticsearch = require('elasticsearch');


const DEFAULT_ELASTICSEARCH_HOST = 'localhost:9200';
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
    this.printErrors = options.printErrors || DEFAULT_PRINT_ERRORS;

    this.client = new elasticsearch.Client({ host: self.host });
  }

  /**
   * Handle an outbound raddec.
   * @param {Raddec} raddec The outbound raddec.
   */
  handleRaddec(raddec) {
    let self = this;
    let id = raddec.timestamp + '_' + raddec.transmitterId + '_' +
             raddec.transmitterIdType;

    self.client.create({
        index: 'raddec',
        type: 'raddec',
        id: id,
        body: raddec
    }, function(err, response, status) {
      if(err && self.printErrors) {
        console.error('barnacles-elasticsearch error:', error);
      }
    });
  }
}


module.exports = BarnaclesElasticsearch;
