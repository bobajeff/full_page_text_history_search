const connect_to_chrome = require('./connect_to_chrome');
const run_io_manager = require('./io_manager');
const EventEmitter = require('events');


class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();
global.app.consts = {};

(async () => {
    connect_to_chrome();
    run_io_manager();

})()