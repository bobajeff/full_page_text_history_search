const getpagetext = require('./text_extracter')
module.exports = function(cdp){
    getpagetext(cdp);
}