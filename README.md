# Full page text history search
A utility to do full page text search of any page you've visited.

## Install
run `sh install.sh`

## Use
To use run your browser with remote debugging enabled. *Note: Currently, this only works with chromium based browsers (see:[*](#about-firefox))*

  - eg. `google-chrome-stable --remote-debugging-port=9222`
  
From the project directory run:

  - `node ./indexer/app.js`

Once started you should be able to search your history by opening http://history/ in your browser.

## About Mac
Haven't tested on Mac (as I don't have one) but I'm currently unaware of any issue preventing it from working.

## About Windows
I have not tested on Windows yet as MeiliSearch's support for it looks to still be in progress.
Theoretically, it can work. Though, It may not work very well.

## About Firefox
The nightly release of Firefox is the only version that supports CDP-based remote debugging. For more information go here: https://firefox-source-docs.mozilla.org/remote/Usage.html

Currently, Firefox hasn't implemented the necessary features for Puppeteer's `exposeFunction()` to work.
* https://github.com/puppeteer/puppeteer/issues/6116
* https://bugzilla.mozilla.org/show_bug.cgi?id=1549487

Beyond that feature I'm not aware of any thing else blocking this from working on it.
