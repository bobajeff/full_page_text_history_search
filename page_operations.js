const liveTextExtractor = require('./live_text_extractor')
const captureSnapshotMethod = require('./periodic_DOMSnapshot_text_extracter')

/* 
Takes and CDPSession and runs page operations with it.
 */
module.exports = async function (page, cdp){
    let address = await page.url();
    let title = await page.title();

    let timestamp = await Date.now();
    var document = {
        timestamp: timestamp,
        address: address,
        title: title,
        livetext: null,
        screenshot_path: null,
        screenshot_data: null
    };
    
    async function updatePageData(){
      document.title = await page.title();
      document.screenshot_data = await page.screenshot();
      global.app.events.emit('text_updated', document);
    }
    await page.on('domcontentloaded', updatePageData);
    await page.on('load', updatePageData);
    //some pages either fire the events too quick or not at all so..
    setTimeout(updatePageData, 5000); // 5 secs

    await liveTextExtractor(page, document);


// captureSnapshotMethod(page, cdp);
 };



