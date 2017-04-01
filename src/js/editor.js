class EditorManager {
    constructor() {
        this.editor = ace.edit("editor");
        this.worker = null;
        this.png = null;

        this.drawGraph = () => {
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

        this.getEditorSession = () => {
            return this.editor.getSession();
        }

        this.run = () => {
            this.editor.getSession().setMode("ace/mode/dot");
            this.editor.setShowPrintMargin(false);
            this.editor.resize();
            const drawGraph = this.drawGraph;
            this.editor.on("change", function() {
                drawGraph();
            });
            const editor = this.editor;
            $(window).resize(() => {
                const h = $(window).height();
                const nh = $('nav').height();
                $('#editor').height(h - nh);
            });
            $(window).on('load', () => {
                editor.resize();
            });
        }
    }
}

const EDITOR_INSTANCE = new EditorManager();
EDITOR_INSTANCE.run();
EDITOR_INSTANCE.drawGraph();
