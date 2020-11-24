const configuration = require('./configuration.json')
const config = configuration.settings.meilisearch;
const host = "http://" + config.address + ":" + config.port;

const MeiliSearch = require('meilisearch')
// Or if you are on a front-end environment:


;(async () => {
  const client = new MeiliSearch({
    host: host,
    apiKey: config.searchkey,
  })

  const index = await client.createIndex('pages'); 
 console.log(response);
})()