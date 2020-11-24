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

  const page = (await browser.pages())[0];
  //await browser.close();
  return {browser: browser, page: page};
};

