const liveTextExtractor = require('./live_text_extractor');
const screenshot_taker = require('./screenshot_taker');
const randomString = require('./randomStringGenerator');
const captureSnapshotMethod = require('./periodic_DOMSnapshot_text_extracter')
const outter_func_rexp = /(^\(\) +=>{)|(^\(\)=> +{)|(^\(\) => +{)|(^\(\)=>{)|(}$)/g;

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
        livetext: "",
        screenshot_path: "",
        screenshot_data: null
    };
    
    async function updatePageData(){
      document.title = await page.title();
      global.app.events.emit('text_updated', document);
    }
    await page.on('domcontentloaded', updatePageData);
    await page.on('load', updatePageData);
    //some pages either fire the events too quick or not at all so..
    setTimeout(updatePageData, 5000); // 5 secs
    
    var liveTextExtractorString = await liveTextExtractor(page, document);
    var screenshotTakerString = await screenshot_taker(page, document);

    //-------------------------***This is injected into the browser (not run on node.js) ***-------------------
    var pageEventHandlerString = (()=>{
      function RunONDOMContentLoaded() {
        takescreenshot(); //this will likely be a white screen if it's not loaded all the way
        liveTextExtractor();//Need to wait for document.body to be available before running most of the operations
      };
      function runOnfocus(){
        console.log('focused!')
        takescreenshot(); //do to a limitation in puppeteer I can't take a screenshot unless the tab is focused
      }

      if (document.readyState === 'loading') {  // Loading hasn't finished yet
          document.addEventListener('DOMContentLoaded', RunONDOMContentLoaded);
      } else {  // `DOMContentLoaded` has already fired
        liveTextExtractor();
      }
      window.addEventListener('focus', runOnfocus);

      function removeListeners(){
        document.removeEventListener('DOMContentLoaded', RunONDOMContentLoaded);
        window.removeEventListener('focus', runOnfocus);
      }
      //remove listeners after a minute has past
      //I want to keep them alive enough for the screenshot taker to have a chance at getting a decent shot
      setTimeout(removeListeners, 60000); // 1 minute

    }).toString().replace(outter_func_rexp, "");
    //-----------------------------------------------------------------------------------------------------------

    page.evaluate('(()=>{' + pageEventHandlerString + '\n' + screenshotTakerString + '\n' + liveTextExtractorString + '})();');


// captureSnapshotMethod(page, cdp);
 };



