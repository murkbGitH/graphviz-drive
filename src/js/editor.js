class EditorManager {
    run() {
        const editor = ace.edit("editor");
        editor.getSession().setMode("ace/mode/dot");
        editor.setShowPrintMargin(false);
        editor.resize();

        $(window).resize(() => {
            const h = $(window).height();
            const nh = $('nav').height();
            $('#editor').height(h - nh);

        });
    }
}
(new EditorManager()).run();
