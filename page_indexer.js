const puppeteer_utilies = require('./init_puppeteer.js');
var page_crawler = require('./page_crawler.js');

const MeiliSearch = require('meilisearch')
const fs = require('fs')

const configuration = require('./configuration.json')
const config = configuration.settings.meilisearch;
const host = "http://" + config.address + ":" + config.port;

;(async () => {
  const browser = await puppeteer_utilies.startPuppeteerSession();
  const page = await browser.newPage();
    const client = new MeiliSearch({
      host: host,
      apiKey: config.searchkey,
    })
  
    const index = client.getIndex('pages');
  
    
    let pageJson = await page_crawler.getPageJson('http://0.0.0.0:8000/archive/1605905557.655183/blog.self.li/post/16366939413/how-to-convert-bookmarklet-to-chrome-extension.html', page);
    let pageJson2 = await page_crawler.getPageJson('http://0.0.0.0:8000/archive/1605904857.309566/developer.android.com/studio/install.html', page);

    var documents = [];
  
    documents.push(pageJson);
    documents.push(pageJson2);
    let response = await index.addDocuments(documents)

    console.log(await index.getAllUpdateStatus())
    console.log(response) // => { "updateId": 0 }
    await browser.close();
  })()

