class Editor {
    constructor() {
        this.editor = ace.edit("editor");
        this.worker = null;
        this.png = null;
    }

    drawGraph() {
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

        this.worker.onmessage = (e) => {
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
        this.worker.onerror = function(e) {
            console.error(e);
        }
        this.worker.postMessage(arg);
    }

    getEditorSession() {
        return this.editor.getSession();
    }

    run() {
        this.editor.getSession().setMode("ace/mode/dot");
        this.editor.setShowPrintMargin(false);
        this.editor.resize();
        this.editor.on("change", function() {
            drawGraph();
        });

        $(window).resize(() => {
            const h = $(window).height();
            const nh = $('nav').height();
            $('#editor').height(h - nh);

        });
    }
}

const EDITOR_INSTANCE = new Editor();
EDITOR_INSTANCE.run();
EDITOR_INSTANCE.drawGraph();
