"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Editor = function () {
    function Editor() {
        _classCallCheck(this, Editor);

        this.editor = ace.edit("editor");
        this.worker = null;
        this.png = null;
    }

    _createClass(Editor, [{
        key: "drawGraph",
        value: function drawGraph() {
            console.log("drawGraph called");
            if (this.worker) {
                this.worker.terminate();
            }
            this.worker = new Worker("/js/worker.js");

            var arg = {
                src: this.editor.getSession().getDocument().getValue(),
                options: {
                    engine: 'dot',
                    format: 'svg'
                }
            };

            this.worker.onmessage = function (e) {
                var graph = document.getElementById('viewer');
                var svgarea = graph.firstChild; // graph.querySelector('svg');
                if (svgarea) {
                    svgarea.parentNode.removeChild(svgarea);
                }
                var parser = new DOMParser();
                var svg = parser.parseFromString(e.data, "image/svg+xml");
                graph.appendChild(svg.documentElement);

                // TODO png 作成
                // this.png = Viz.svgXmlToPngImageElement(document.getElementById('graph').innerHTML);
            };
            this.worker.onerror = function (e) {
                console.error(e);
            };
            this.worker.postMessage(arg);
        }
    }, {
        key: "getEditorSession",
        value: function getEditorSession() {
            return this.editor.getSession();
        }
    }, {
        key: "run",
        value: function run() {
            this.editor.getSession().setMode("ace/mode/dot");
            this.editor.setShowPrintMargin(false);
            this.editor.resize();
            this.editor.on("change", function () {
                drawGraph();
            });

            $(window).resize(function () {
                var h = $(window).height();
                var nh = $('nav').height();
                $('#editor').height(h - nh);
            });
        }
    }]);

    return Editor;
}();

var EDITOR_INSTANCE = new Editor();
EDITOR_INSTANCE.run();
EDITOR_INSTANCE.drawGraph();