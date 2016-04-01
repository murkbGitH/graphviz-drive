const TEXT_MIME_TYPE    = 'text/plain';
const SVG_MIME_TYPE     = 'image/svg+xml';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = "1027551625677-9582c548i7072iih701rp3a0aeua98jg.apps.googleusercontent.com";

//var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.install'];

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
    console.log("checkAuth");
    gapi.auth
        .authorize(
            {
                'client_id': CLIENT_ID,
                'scope': SCOPES.join(' '),
                'immediate': true
            },
            handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        // Hide auth UI, then load client library.
        authorizeDiv.style.display = 'none';
    } else {
        // Show auth UI, allowing the user to initiate authorization by
        // clicking authorize button.
        authorizeDiv.style.display = 'inline';
    }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
    gapi.auth.authorize(
            {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
            handleAuthResult);
    return false;
}


var DEFAULT_FILE = {
    content: 'DEFAULT_FILE DAYO',
    metadata: {
        id: null,
        title: 'untitled.txt',
        mimeType: 'text/plain',
        editable: true
    }
};


/**
 * Start the file upload.
 *
 * @param {Object} evt Arguments from the file selector.
 */
function writeFile(fileName, content, contentType) {
    gapi.client.load('drive', 'v2', function () {
        insertFile(fileName,content, contentType);
    });
}

function writeTextFile(fileName, content) {
    writeFile(fileName, content, TEXT_MIME_TYPE);
}



/**
 * Insert new file.
 *
 * @param {fileName} 保存するファイル名
 * @param {content} 保存するファイルの内容
 * @param {Function} callback Function to call when the request is complete.
 */
function insertFile(fileName,content, contentType, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var metadata = {
        'title': fileName,
        'mimeType': contentType
    };

    var base64Data = utf8_to_b64(content);
    var multipartRequestBody = delimiter +
        'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' + base64Data + close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {
            'uploadType': 'multipart'
        },
        'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    });
    if(!callback) {
        callback = function (file) {
            alert("保存しました");
            console.log(file)
        };
    }
    request.execute(callback);
}

// from http://ecmanaut.blogspot.jp/2006/07/encoding-decoding-utf8-in-javascript.html
function utf8_to_b64(str) {
    return window.btoa( unescape(encodeURIComponent( str )) );
}

var editor = ace.edit("editor");
var parser = new DOMParser();
var worker;
var result;
var isFilenameSpecified = false;

function drawGraph() {
    console.log("drawGraph called");
    if (worker) {
        worker.terminate();
    }
    worker = new Worker("worker.js");

    var arg = {
        src: editor.getSession().getDocument().getValue(),
        options: {
            engine: 'dot',
            format: 'svg'
        }
    };

    worker.onmessage = function(e) {
        result = e.data;
        var graph = document.getElementById('graph');
        var svgarea = graph.firstChild; // graph.querySelector('svg');
        if (svgarea) {
            svgarea.parentNode.removeChild(svgarea);
        }
        var svg = parser.parseFromString(result, "image/svg+xml");
        graph.appendChild(svg.documentElement);
    }
    worker.onerror = function(e) {
        console.error(e);
    }
    worker.postMessage(arg);
}

editor.getSession().setMode("ace/mode/dot");
editor.on("change", function() {
    drawGraph();
});

document.getElementById('save_btn').addEventListener(
    'click',
    function () {
        var fileName = document.getElementById('fileName').textContent;
        var s = document.getElementById('fileFormat');
        var fileFormat = s.options[s.selectedIndex].value;
        s = document.getElementById('savePlace');
        var savePlace = s.options[s.selectedIndex].value;

        //console.log(fileFormat + "," + savePlace);

        var promptResult = prompt('File Name', fileName);
        if (promptResult) {
            fileName = promptResult;
        } else {
            console.log("Input fileName canceled.");
            return;
        }
        var content  = editor.getSession().getDocument().getValue();
        writeTextFile(fileName, content);
/*
        var fileName = document.getElementById('fileName').textContent + ".svg";
        var promptResult = prompt('File Name', fileName);
        if (promptResult) {
            fileName = promptResult;
        } else {
            console.log("Input fileName canceled.");
            return;
        }
        var content = document.getElementById('graph').innerHTML;
        console.log(content);
        writeFile(fileName, content, SVG_MIME_TYPE);
*/
    }
);

drawGraph();
