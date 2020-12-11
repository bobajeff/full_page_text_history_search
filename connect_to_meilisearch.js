const MeiliSearch = require('meilisearch');
const configuration = require('./configuration.json')

const config = configuration.settings.meilisearch;
const host = "http://" + config.address + ":" + config.port;

module.exports = async function(){
    const client = await new MeiliSearch({
        host: host,
        apiKey: config.searchkey,
      })
      return client;
}