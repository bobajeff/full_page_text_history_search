const MeiliSearch = require('meilisearch')
const documentLogger = require('./page_crawler.js')
const configuration = require('./configuration.json')
const config = configuration.settings.meilisearch;
const host = "http://" + config.address + ":" + config.port;

;(async () => {
    documentLogger.logDocuments();
    const client = new MeiliSearch({
      host: host,
      apiKey: config.searchkey,
    })
  
    const index = client.getIndex('pages');
    documentLogger.loggerEvents.on('pageready', async (page) => {
        await page.goto('http://0.0.0.0:8000/archive/1605905557.655183/blog.self.li/post/16366939413/how-to-convert-bookmarklet-to-chrome-extension.html');
        await page.goto('http://0.0.0.0:8000/archive/1605904857.309566/developer.android.com/studio/install.html');
    })

    
    documentLogger.loggerEvents.on('documents_added', async () => {
        let response = await index.addDocuments(global._meilisearch_documents)
    
        console.log(await index.getAllUpdateStatus())
        console.log(response)
        documentLogger.loggerEvents.removeAllListeners();
      });
  })();

