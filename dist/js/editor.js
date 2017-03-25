"use strict";function _classCallCheck(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function e(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(r,t,n){return t&&e(r.prototype,t),n&&e(r,n),r}}(),Editor=function(){function e(){_classCallCheck(this,e),this.editor=ace.edit("editor"),this.worker=null,this.png=null}return _createClass(e,[{key:"drawGraph",value:function(){console.log("drawGraph called"),this.worker&&this.worker.terminate(),this.worker=new Worker("/js/worker.js");var e={src:this.editor.getSession().getDocument().getValue(),options:{engine:"dot",format:"svg"}};this.worker.onmessage=function(e){var r=document.getElementById("viewer"),t=r.firstChild;t&&t.parentNode.removeChild(t);var n=new DOMParser,o=n.parseFromString(e.data,"image/svg+xml");r.appendChild(o.documentElement)},this.worker.onerror=function(e){console.error(e)},this.worker.postMessage(e)}},{key:"run",value:function(){this.editor.getSession().setMode("ace/mode/dot"),this.editor.setShowPrintMargin(!1),this.editor.resize(),this.editor.on("change",function(){drawGraph()}),$(window).resize(function(){var e=$(window).height(),r=$("nav").height();$("#editor").height(e-r)})}}]),e}();(new Editor).run(),(new Editor).drawGraph();