import EventEmitter from 'events';
import connect_to_chrome from './connect_to_chrome.js';
import run_index_manager from './index_manager.js';

class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();

(async () => {
    connect_to_chrome();
    run_index_manager();

})()