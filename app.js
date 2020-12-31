import EventEmitter from 'events';
import connect_to_browser from './connect_to_browser.js';
import run_index_manager from './index_manager.js';

class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();

(async () => {
    connect_to_browser();
    run_index_manager();

})()