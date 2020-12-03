const liveTextExtractor = require('./live_text_extractor')
const captureSnapshotMethod = require('./periodic_DOMSnapshot_text_extracter')
/* 
Takes a CDPSession and returns a string of text
 */
module.exports = async function (page, cdp){
await liveTextExtractor(page);
 
    // captureSnapshotMethod(page, cdp);

     
 };



