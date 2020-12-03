const liveTextExtractor = require('./live_text_extractor')
const captureSnapshotMethod = require('./periodic_DOMSnapshot_text_extracter')
const fs = require('fs');
const fsPromises = fs.promises;
const url = require('url');
const forward_slash_at_beginning_or_end_of_string = /(^\/)|(\/$)/g; //regex to match forward slash at beginning or end of string



/* 
Takes and CDPSession and runs page operations with it.
 */
module.exports = async function (page, cdp){
    let page_id = page._target._targetId;
    let address = await page.url();
    let address_obj = await url.parse(address);
    let {hostname, pathname, search, hash} = address_obj;
    let title = await page.title();


    let sanitized_address = await address.replace(/[^a-z0-9_\-]/gi, '_');
    let timestamp = await Date.now();
    let globalname = page_id + '.' + sanitized_address + '.' + timestamp;
    global.app.pagedata[globalname] = {
        timestamp: timestamp,
        address: address,
        title: title,
        livetext: null,
        screenshot: null,
    };


    await liveTextExtractor(page, globalname);
    // let livetext = global[globalname].text;


    pathname = await pathname.replace(forward_slash_at_beginning_or_end_of_string,'');    //make sure pathname doesn't begin or end in a forward slash
    let data_directory = './data/site_data/' + hostname + '/' + timestamp + '/' + pathname;
    data_directory = search ? data_directory + '/' + search : data_directory;
    data_directory = hash ? data_directory + '/' + hash : data_directory;

    let screenshot_path = data_directory + '/' + 'screenshot.png';

    //Json to be sent to search engine
    global.app.pagedata[globalname].screenshot = screenshot_path;

    await fsPromises.access(data_directory, fs.constants.F_OK)
    .catch(async() => {
                await fs.mkdir(data_directory, { recursive: true }, function(err) {
                    if (err) {
                      console.log(err)
                    }
                  })
    });

    let screenshot_options = {path: screenshot_path};
    let screenshot = await page.screenshot(screenshot_options);


// captureSnapshotMethod(page, cdp);
 };



