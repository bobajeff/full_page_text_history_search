import MeiliSearch from 'meilisearch';
import configuration from './configuration.js';

const config = configuration.meilisearch;
const host = "http://" + config.address + ":" + config.port;

export default async function(){
    const client = await new MeiliSearch({
        host: host,
        apiKey: config.searchkey,
      })
      return client;
}