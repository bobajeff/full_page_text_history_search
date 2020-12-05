const randomString = require('./randomStringGenerator');
const outter_func_rexp = /(^\(\) +=>{)|(^\(\)=> +{)|(^\(\) => +{)|(^\(\)=>{)|(}$)/g;

module.exports = async function(page, document){
    var tries_before_quit = 12; //cap the numbe of tries for the screenshot at 12
    var takeScreenshot_func_name = await randomString();

    await page.exposeFunction(takeScreenshot_func_name, async () => {
        document.screenshot_data = await page.screenshot();
        if (!!document.screenshot_data || tries_before_quit == 0)
        {
            global.app.events.emit('text_updated', document);
            return true;
        }
        else 
        {
            tries_before_quit--;
            return false;
        }
    });

    //-------------------------***This is injected into the browser (not run on node.js) ***-------------------
        //check if tab is in focus
    var screenshotEvaluateString = (() => {
        async function takescreenshot(){
            if (!document.hidden){//Only take screen shot if window and tab has focus // do to a limitation in puppeteer
                var success = await window['takeScreenshot_func_name']();
                if (success){
                    console.log('success!');
                }
            }
        }
        takescreenshot();
    //     document.addEventListener("visibilitychange", function() {
    //     console.log( document.visibilityState );
    //     if (!document.hidden){
    //         console.log('visible!');
    //       var success = window['takeScreenshot_func_name']();
    //       if (success){
    //           console.log('success!');
    //       }
    //     };
    //   }, false);
    }).toString().replace(/takeScreenshot_func_name/gm, takeScreenshot_func_name).replace(outter_func_rexp, "");
    //-----------------------------------------------------------------------------------------------------------

    return screenshotEvaluateString;
}