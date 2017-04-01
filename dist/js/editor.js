"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorManager = function EditorManager() {
    var _this = this;

    _classCallCheck(this, EditorManager);

    this.editor = ace.edit("editor");
    this.worker = null;
    this.png = null;

    this.drawGraph = function () {
        console.log("drawGraph called");
        if (_this.worker) {
            _this.worker.terminate();
        }
        _this.worker = new Worker("/js/worker.js");

        var arg = {
            src: _this.editor.getSession().getDocument().getValue(),
            options: {
                engine: 'dot',
                format: 'svg'
            }
        };

        _this.worker.onmessage = function (e) {
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
        _this.worker.onerror = function (e) {
            console.error(e);
        };
        _this.worker.postMessage(arg);
    };

    this.getEditorSession = function () {
        return _this.editor.getSession();
    };

    this.run = function () {
        _this.editor.getSession().setMode("ace/mode/dot");
        _this.editor.setShowPrintMargin(false);
        _this.editor.resize();
        var drawGraph = _this.drawGraph;
        _this.editor.on("change", function () {
            drawGraph();
        });
        var editor = _this.editor;
        $(window).resize(function () {
            var h = $(window).height();
            var nh = $('nav').height();
            $('#editor').height(h - nh);
        });
        $(window).on('load', function () {
            editor.resize();
        });
    };
};

var EDITOR_INSTANCE = new EditorManager();
EDITOR_INSTANCE.run();
EDITOR_INSTANCE.drawGraph();