barnacles-elasticsearch
=======================

__barnacles-elasticsearch__ writes IoT data to Elasticsearch.

![Overview of barnacles-elasticsearch](https://reelyactive.github.io/barnacles-elasticsearch/images/overview.png)

__barnacles-elasticsearch__ ingests a real-time stream of _raddec_ & _dynamb_ objects from [barnacles](https://github.com/reelyactive/barnacles/) and _spatem_ objects from [chimps](https://github.com/reelyactive/chimps/) which it writes to a given Elasticsearch instance.  It couples seamlessly with reelyActive's [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source IoT middleware.

__barnacles-elasticsearch__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnacles-elasticsearch) that can run on resource-constrained edge devices as well as on powerful cloud servers and anything in between.


Pareto Anywhere integration
---------------------------

A common application of __barnacles-elasticsearch__ is to write IoT data from [pareto-anywhere](https://github.com/reelyactive/pareto-anywhere) to a local or remote Elasticsearch database.  Simply follow our [Create a Pareto Anywhere startup script](https://reelyactive.github.io/diy/pareto-anywhere-startup-script/) tutorial using the script below:

```javascript
#!/usr/bin/env node

const ParetoAnywhere = require('../lib/paretoanywhere.js');

// Edit the options to specify the Elasticsearch instance
const BARNACLES_ELASTICSEARCH_OPTIONS = {};

// ----- Exit gracefully if the optional dependency is not found -----
let BarnaclesElasticsearch;
try {
  BarnaclesElasticsearch = require('barnacles-elasticsearch');
}
catch(err) {
  console.log('This script requires barnacles-elasticsearch.  Install with:');
  console.log('\r\n    "npm install barnacles-elasticsearch"\r\n');
  return console.log('and then run this script again.');
}
// -------------------------------------------------------------------

let pa = new ParetoAnywhere();
pa.barnacles.addInterface(BarnaclesElasticsearch,
                          BARNACLES_ELASTICSEARCH_OPTIONS);
```


Options
-------

__barnacles-elasticsearch__ supports the following options:

| Property      | Default                    | Description                    | 
|:--------------|:---------------------------|:-------------------------------|
| node          | "http://localhost:9200"    | Elasticsearch node             |
| clientOptions | null                       | Object of parameters for client instantiation |
| client        | null                       | An instantiated Elasticsearch client |
| printErrors   | false                      | Print errors to the console (for debug) |
| eventsToStore | { raddec: {}, dynamb: {}, spatem: {} } | See default event-specific properties below |
| esVersion     | 8                          | Can be forced to 7 if required |

For raddec events, all [raddec](https://github.com/reelyactive/raddec/) toFlattened() options are supported.  The default is { includePackets: false }.

By default __barnacles-elasticsearch__ will connect and write to localhost:9200.


Connecting to an Elastic Cloud instance
---------------------------------------

Connecting to the Elastic Cloud is straightforward using the _clientOptions_ as follows:

```javascript
const clientOptions = {
    cloud: { id: "copy-paste from Elastic Cloud dashboard" },
    auth: {
        username: "pareto-anywhere",
        password: "password"
    }
}
barnacles.addInterface(BarnaclesElasticsearch, { clientOptions: clientOptions });
```

Connecting to a self-hosted instance
------------------------------------

See the [Elasticsearch JavaScript client API documentation on connecting](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-connecting.html) to select the appropriate _clientOptions_ for your instance.


Project History
---------------

- __Version 1.1+__ expects an Elasticsearch 8.x instance, but should be backwards-compatible with 7.x nonetheless
- __Version 1.0__ expects an Elasticsearch 7.x instance (see release-1.0 branch)


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.


License
-------

MIT License

Copyright (c) 2019-2024 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
