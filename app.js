const connect_to_chrome = require('./connect_to_chrome');
const EventEmitter = require('events');
class AppEmitter extends EventEmitter {}
global.app = {};
global.app.pagedata = {};
global.app.events = new AppEmitter();

(async () => {
    connect_to_chrome();

    const write_interval = 20000; //20 seconds 
    var write_queue = [];
    var queue_checker_is_on = false;
    var write_timer = 

    global.app.events.on('text_updated', async (globalname) => {
        //console.log(global.app.pagedata[globalname]);
        if (!write_queue.includes(globalname)) //don't add duplicates to the write queue 
        {
            write_queue.push(globalname);
            if(!queue_checker_is_on){
                check_queue();
            }
        }
    } );

    async function write_data(){
        let globalname = write_queue[0];
        let data = global.app.pagedata[globalname];
        //write data to file;
        console.log(data);
        write_queue.shift(); //remove first item in array
        if (write_queue.length == 0)
        {
            clearInterval(write_timer);
            queue_checker_is_on = false;
        }
    }
    async function check_queue(){
        queue_checker_is_on = true;
        write_timer = setInterval(write_data, write_interval);
    }

})()