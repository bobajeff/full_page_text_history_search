import liveTextExtractor from './live_text_extractor.js';

const outter_func_rexp = /(^\(\) +=>{)|(^\(\)=> +{)|(^\(\) => +{)|(^\(\)=>{)|(}$)/g;

/* 
Takes and CDPSession and runs page operations with it.
 */
const page_blacklist = ["http://localhost:3000/"]
export default async function (page, cdp){

    let address = await page.url();
    if (!page_blacklist.includes(address))
    {
      let title = await page.title();
  
      let timestamp = await Date.now();
      var document = {
          timestamp: timestamp,
          address: address,
          title: title,
          livetext: ""
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
  
      //-------------------------***This is injected into the browser (not run on node.js) ***-------------------
      var pageEventHandlerString = (()=>{
        function RunONDOMContentLoaded() {
          liveTextExtractor();//Need to wait for document.body to be available before running most of the operations
        };
  
        if (document.readyState === 'loading') {  // Loading hasn't finished yet
            document.addEventListener('DOMContentLoaded', RunONDOMContentLoaded);
        } else {  // `DOMContentLoaded` has already fired
          liveTextExtractor();
        }
  
        function removeListeners(){
          document.removeEventListener('DOMContentLoaded', RunONDOMContentLoaded);
        }
        //remove listeners after a minute has past
        //I want to keep them alive enough for the screenshot taker to have a chance at getting a decent shot
        setTimeout(removeListeners, 60000); // 1 minute
  
      }).toString().replace(outter_func_rexp, "");
      //-----------------------------------------------------------------------------------------------------------
  
      page.evaluate('(()=>{' + pageEventHandlerString + '\n' + liveTextExtractorString + '})();');
      // captureSnapshotMethod(page, cdp);
  
    }  
 };



