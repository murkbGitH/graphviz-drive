"use strict";

importScripts("/lib/viz.1.3.0.js");
onmessage = function onmessage(e) {
    var result = Viz(e.data.src, e.data.options);
    postMessage(result);
};