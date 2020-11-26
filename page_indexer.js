const MeiliSearch = require('meilisearch')
const Crawler = require('./page_crawler.js')
const configuration = require('./configuration.json')
const config = configuration.settings.meilisearch;
const host = "http://" + config.address + ":" + config.port;
const testpages = require('./test_pages');

(async () => {
    Crawler.logDocuments();
    const client = new MeiliSearch({
      host: host,
      apiKey: config.searchkey,
    })
  
    const index = client.getIndex('pages');
    Crawler.crawlerEvents.on('pageready', async (page) => {
      testpages.forEach(async(address) => {
        await page.goto(address);
      });
    })

    
    Crawler.crawlerEvents.on('documents_added', async () => {
        let response = await index.addDocuments(global._meilisearch_documents)
    
        console.log(await index.getAllUpdateStatus())
        console.log(response)
        Crawler.crawlerEvents.removeAllListeners();
      });
  })();

