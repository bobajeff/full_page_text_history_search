import connect_to_meilisearch from './connect_to_meilisearch.js';

;(async () => {
  const client = await connect_to_meilisearch();

  const index = await client.createIndex('pages'); 

console.log(index);
})()