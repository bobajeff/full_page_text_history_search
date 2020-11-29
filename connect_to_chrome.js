const puppeteer = require('puppeteer');
const configuration = require('./configuration.json')
const runPageOperations = require('./page_operations')

const wsChromeEndpointurl = configuration['settings']['puppeteer']['wsChromeEndpointurl'];


(async () => {
    const browser = await puppeteer.connect({
    browserWSEndpoint: wsChromeEndpointurl,
    defaultViewport: null
});

browser.on('targetchanged', async (target) => {
    if (target.type() === 'page') {
        console.log('\n[targetchanged event]\n');
        let cdp = await target.createCDPSession();
        var page = await target.page();
        
        page.on('DOMContentLoaded', async () => {
            console.log('\n[DOMContentLoaded event]\n');
            var cdp = await target.createCDPSession();
            runPageOperations(cdp);
        });
        page.on('load', async () => {
            console.log('\n[load event]\n')
            var cdp = await target.createCDPSession();
            runPageOperations(cdp);
        });

        runPageOperations(cdp);
    }
})
    
const pages = (await browser.pages());
console.log('open pages:');
console.log(pages.length);

var cdp = await pages[0].target().createCDPSession();
var targets = await cdp.send('Target.getTargets');
console.log('targets:');
console.log(targets['targetInfos'].length);

attached_targets = 0;
targets['targetInfos'].forEach(async (target) => {
    if (target['attached'] == true)
    {
        attached_targets++;
    }
})
console.log('attached targets:');
console.log(attached_targets);

})();