const getpagetext = require('./text_extracter')
/* 
Takes and CDPSession and runs page operations with it.
 */
module.exports = function(page, cdp){
    getpagetext(page, cdp);
}