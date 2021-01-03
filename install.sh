#!/bin/sh
#TODO make this a npm/node script
GREEN='\033[32m'
DEFAULT='\033[0m'
mkdir bin &&
cd bin &&
curl -L https://install.meilisearch.com | sh &&
cd ../history_page &&
npm install && 
npm run build &&
cd ../indexer &&
npm install &&
node generate_response_json.js &&
printf "Everything is installed.\n"
echo "Now start Chrome (or another browser with support for ChromeDevTools Protocol) with:"
#TODO: make the debbugging port configurable from the configuration.js file
printf "$GREEN%s\n$DEFAULT" "google-chrome --remote-debugging-port=9222"
echo "Then start the servers"
printf "$GREEN%s\n$DEFAULT" "node ./indexer/app.js"