const run_io_manager = require('./io_manager');
const EventEmitter = require('events');


class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();
global.app.consts = {};

(async () => {
    // Remove: once migrated to es modules
    const { default: connect_to_chrome } = await import('./connect_to_chrome.mjs');
    connect_to_chrome();
    run_io_manager();

})()