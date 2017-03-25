importScripts("./viz.1.3.0.js");
onmessage = function(e) {
    var result = Viz(e.data.src, e.data.options);
    postMessage(result);
}
