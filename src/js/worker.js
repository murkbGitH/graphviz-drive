importScripts("/lib/viz.1.3.0.js");
onmessage = (e) => {
    let result = Viz(e.data.src, e.data.options);
    postMessage(result);
};
