import puppeteer from 'puppeteer-core';

import getWebSocketDebuggerUrl from './getWebSocketDebuggerUrl.js';
import runPageOperations from './page_operations.js';
import serve_history_page from './serve_history_page.js';

export default async function async () {

    let WSEndpointUrl = await getWebSocketDebuggerUrl();
    const browser = await puppeteer.connect({
        browserWSEndpoint: WSEndpointUrl,
        defaultViewport: null
    });
    
    browser.on('targetchanged', async (target) => {
        if (target.type() === 'page') {
            console.log('\n[targetchanged event]\n');
            let cdp = await target.createCDPSession();
            var page = await target.page();
            
            serve_history_page(cdp);
            runPageOperations(page, cdp);
        }
    })
    //Get tagets for tabs opened in the background
    //      ex: tabs that are opened by middle click
    browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
            console.log('\nnew tab opened\n');
            let cdp = await target.createCDPSession();
            var page = await target.page();
            
            serve_history_page(cdp);
            runPageOperations(page, cdp);
        }
    });
    //TODO make sure to on the run these functions ^ single
    //Make a test to see if the page target is already being handled 
    
    const pages = (await browser.pages());
    console.log('open pages:');
    console.log(pages.length);

    var cdp = await pages[0].target().createCDPSession();
    var targets = await cdp.send('Target.getTargets');
    console.log('targets:');
    console.log(targets['targetInfos'].length);

    var attached_targets = 0;
    targets['targetInfos'].forEach(async (target) => {
        if (target['attached'] == true)
        {
            attached_targets++;
        }
    })
    console.log('attached targets:');
    console.log(attached_targets);

    // Handle when the page gets closed suddenly
    process.on('unhandledRejection', (reason) => {
        console.log(reason.message);
    });

};