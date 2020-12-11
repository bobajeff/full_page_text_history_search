import EventEmitter from 'events';
import connect_to_chrome from './connect_to_chrome.js';
import run_io_manager from './io_manager.js';

class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();
global.app.consts = {};

(async () => {
    connect_to_chrome();
    run_io_manager();

})()