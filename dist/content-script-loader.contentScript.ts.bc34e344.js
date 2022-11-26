(function () {
  'use strict';

  (async () => {
    await import(
      /* @vite-ignore */
      chrome.runtime.getURL("contentScript.ts.js")
    );
  })().catch(console.error);

})();
