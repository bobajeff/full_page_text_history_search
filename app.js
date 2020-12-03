const connect_to_chrome = require('./connect_to_chrome');
const EventEmitter = require('events');
class AppEmitter extends EventEmitter {}
global.app = {};
global.app.pagedata = {};
global.app.events = new AppEmitter();

(async () => {
    connect_to_chrome();

    global.app.events.on('text_updated', async (globalname) => {
        console.log(global.app.pagedata[globalname]);
    } );

})()