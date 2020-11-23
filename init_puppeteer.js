const fs = require('fs');
const puppeteer = require('puppeteer');

module.exports.startPuppeteerSession = async function() {
  const browser = await puppeteer.launch({
    "args": [
      "--remote-debugging-port=9222",
      '--remote-debugging-address=0.0.0.0'
    ],
    "headless": false,
    "devtools": true,

  });
  //await browser.close();
  return browser;
};

