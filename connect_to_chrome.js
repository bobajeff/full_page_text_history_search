const puppeteer = require('puppeteer');
const configuration = require('./configuration.json')

const wsChromeEndpointurl = configuration['settings']['puppeteer']['wsChromeEndpointurl'];

getpagetext = async function (cdp){
    var document = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: ['visibility'], includeDOMRects: true });
    var {parentIndex, nodeType, nodeName, nodeValue, attributes} = document['documents'][0]['nodes'];
    var {styles, nodeIndex, clientRects} = document['documents'][0]['layout'];
    //console.log(document['strings']);
    console.log(document['documents'][0]['layout']);
    //console.log(styles[1]);
    //console.log(document['documents'][0]);

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
                    var node_is_visible = false;
                    nodeIndex.forEach(async(node_index_value, styles_string_key) => {
                        
                        var parent_of_style_key = parentIndex[styles_string_key];

                        var parent_client_rect_property = clientRects[parent_of_style_key];
                        str_array.push(parent_client_rect_property);
                        if (parent_client_rect_property != undefined)
                        {
                            //                             width                                height
                            if (!!parent_client_rect_property[2] || !!parent_client_rect_property[3] || !!parent_client_rect_property.length){
                                node_is_visible = true;
                            }
                            
                        }
                        else
                        {
                            node_is_visible = false;
                        }
                        //figure out which nodes get styles.
                        if(node_index_value == itr)
                        {
                            //check the visibility property
                            var visibility = document['strings'][styles[styles_string_key][0]]; //index 0 is visibility property here because it's the first property specified on computedStyles
                            //str_array.push('visibility: ' + visibility);

                            //var parentIndex[node_index_value]
                            //var clientRect_length = clientRects[styles_string_key].length;
                            
                        }
                    });
                    
                    if (node_is_visible)
                    {
                        str_array.push(value_string.replace(/\s+/g, " "));

                    }
                    
                    //replace many whitespace characters with one space as thats more likely 
                    /* attribute_strings.filter(attribute_string => attribute_string == "aria-hidden");
                    str_array.push('hidden'); */
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