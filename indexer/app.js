import EventEmitter from 'events';
import connect_to_browser from './connect_to_browser.js';
import run_index_manager from './index_manager.js';
import configuration from './configuration.js';
import {default as fs, promises, constants} from 'fs';
import {spawn} from "child_process";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url)); //Directory containing this file


class AppEmitter extends EventEmitter {}
global.app = {};
global.app.events = new AppEmitter();
global.app.parent_dir = __dirname + "/..";
global.app.logs_dir = global.app.parent_dir + '/logs/';

(async () => {
    //Create logs directory if it doesn't exist
    await promises.access(global.app.logs_dir, constants.F_OK).catch(async() => {
        await promises.mkdir(global.app.logs_dir, { recursive: true }, function(err) {
            if (err) {
                console.log(err)
            }
        });
    });
    
    const meilisearch_process = spawn("./bin/meilisearch", ["--master-key=" + configuration.meilisearch.searchkey], {cwd: global.app.parent_dir});
    meilisearch_process.stdio[2].pipe(fs.createWriteStream(global.app.logs_dir + 'meiliesearch.log'));
    //Kill meilisearch process when terminal is closed
    function close_proccesses() { meilisearch_process.kill(); process.exit()};
    process.on('SIGHUP', close_proccesses);

    connect_to_browser();
    run_index_manager();

})()