const puppeteer = require('puppeteer');
const configuration = require('./configuration.json')

const wsChromeEndpointurl = configuration['settings']['puppeteer']['wsChromeEndpointurl'];

getpagetext = async function (cdp){
    var document = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: ['visibility'], includeDOMRects: true });
    var {parentIndex, nodeType, nodeName, nodeValue, attributes} = document['documents'][0]['nodes'];
    var {styles, nodeIndex, clientRects} = document['documents'][0]['layout'];
    // console.log('strings');
    // console.log(document['strings']);
    //console.log(document['documents'][0]['layout']);
    //console.log(styles[1]);
    //console.log(document['documents'][0]);
    // console.log('nodeValue');
    // console.log(nodeValue);
    // console.log('nodeName');
    // console.log(nodeName);
    // console.log('clientRects');
    // console.log(clientRects);
    // console.log('parentIndex');
    // console.log(parentIndex);
    // console.log('nodeIndex');
    // console.log(nodeIndex);

    var str_array = []
    nodeType.forEach(async (node_type, itr) => {
        let parent_index = parentIndex[itr];
        let parent_string_index = nodeName[parent_index];
        let value_index = nodeValue[itr];
        
        
        var value_string = document['strings'][value_index];
        var parent_string = document['strings'][parent_string_index];
        
        //don't add script noscript or style nodes
        if (parent_string != 'SCRIPT' && parent_string != 'NOSCRIPT' && parent_string != 'STYLE' ) {
            if (node_type == 3){ // check if node is text type
                if (/[^\s]/m.test(value_string))  // remove any tags that contain only whitespace
                {

                    nodeIndex.forEach(async(node_index_value, node_index_key) => {
                        //check if the parent index points to the current node index
                        //if so the values of the corresponding clientrects can be access by the current index key
                        if (parent_index == node_index_value) 
                        {
                            var parent_client_rect_property = clientRects[node_index_key];
                            if (parent_client_rect_property != undefined)
                            {
                                //                             width                                height
                                if (!!parent_client_rect_property[2] || !!parent_client_rect_property[3] || !!parent_client_rect_property.length){
                                    //replace many whitespace characters with one space as thats more likely 
                                    /* attribute_strings.filter(attribute_string => attribute_string == "aria-hidden");
                                    str_array.push('hidden'); */
                                    var text_sanitized = value_string.replace(/\s+/g, " ");
                                    str_array.push(text_sanitized);
                                }
                            }

                        }

                    });
                    
                    
                }
            }
        }
    });
    console.log(str_array);
     
 };

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
            getpagetext(cdp);
        });
        page.on('load', async () => {
            console.log('\n[load event]\n')
            var cdp = await target.createCDPSession();
            getpagetext(cdp);
        });

        getpagetext(cdp);
    }
})
    
const pages = (await browser.pages());
console.log('open pages:');
console.log(pages.length);
/* setTimeout(()=>{}, 120000);
pages.forEach(async (page) => {
    var cdp = await page.target().createCDPSession();

}); */

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