const TEXT_MIME_TYPE    = 'text/plain';
const SVG_MIME_TYPE     = 'image/svg+xml';
const PNG_MIME_TYPE     = 'image/png';

// The Browser API key obtained from the Google Developers Console.
var DEVELOPER_KEY = 'AIzaSyAI5grPt2ETORNhZp05lB950crIyNlffCc';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = "1027551625677-9582c548i7072iih701rp3a0aeua98jg.apps.googleusercontent.com";

//var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.install'];

var oauthToken;
var pickerApiLoaded = false;


// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad() {
//  window.gapi.load('auth', {'callback': onAuthApiLoad});
  window.gapi.load('picker', {'callback': onPickerApiLoad});
}

function onAuthApiLoad() {
  window.gapi.auth.authorize(
      {
        'client_id': clientId,
        'scope': SCOPES.join(' '),
        'immediate': false
      },
      handleAuthResult);
}

function onPickerApiLoad() {
  pickerApiLoaded = true;
}


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
        oauthToken = authResult.access_token;
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
var DEFAULT_FIELDS = 'id,title,mimeType,userPermission,editable,copyable,shared,fileSize';

// Key : value = File, Data?
var drive_files = {};


/**
 * Start the file upload.
 *
 * @param {Object} evt Arguments from the file selector.
 */
function writeFileToGDrive(fileName, content, contentType) {
    gapi.client.load('drive', 'v2', function () {
        insertFile(fileName,content, contentType);
    });
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

    var base64Data;
    if (contentType == PNG_MIME_TYPE) {
        base64Data = content;
    } else {
        base64Data = utf8_to_b64(content);
    }
    console.log(base64Data);
    var multipartRequestBody = delimiter +
        'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' + base64Data + close_delim;

    var request_arg = {
        'path': '/upload/drive/v2/files', // add encodeURICompoment & method = PUT if metadata.id exists
        'method': 'POST',
        'params': {
            'uploadType': 'multipart'
        },
        'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    }
    if (drive_files[fileName]) {
        request_arg['path'] = '/upload/drive/v2/files/' + encodeURIComponent(drive_files[fileName].id);
        request_arg['method'] = 'PUT';
    }
    var request = gapi.client.request(request_arg);
    if(!callback) {
        callback = function (response) {
            alert("保存しました");
            //console.log("response=" + response);
            var metadata = response.id;
            drive_files[fileName] = response;
            //console.log(drive_files);
        };
    }
    request.execute(callback);
}

var metadataRequest;
var contentRequest;
var response;

// load .dot file
function loadFileFromGDrive(fileId) {
    gapi.client.load('drive', 'v3', function () {
        //metadataRequest = gapi.client.drive.files.get({
        //    fileId: fileId,
        //    fields: DEFAULT_FIELDS
        //});
        contentRequest = gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(function(resp){
            response = resp;
            editor.getSession().setValue(resp.body);
        });
    });
}


// from http://ecmanaut.blogspot.jp/2006/07/encoding-decoding-utf8-in-javascript.html
function utf8_to_b64(str) {
    return window.btoa( unescape(encodeURIComponent( str )) );
}

var editor = ace.edit("editor");
var worker;
var png;

function drawGraph() {
    console.log("drawGraph called");
    if (worker) {
        worker.terminate();
    }
    worker = new Worker("./worker.js");

    var arg = {
        src: editor.getSession().getDocument().getValue(),
        options: {
            engine: 'dot',
            format: 'svg'
        }
    };

    worker.onmessage = function(e) {
        var graph = document.getElementById('graph');
        var svgarea = graph.firstChild; // graph.querySelector('svg');
        if (svgarea) {
            svgarea.parentNode.removeChild(svgarea);
        }
        var parser = new DOMParser();
        var svg = parser.parseFromString(e.data, "image/svg+xml");
        graph.appendChild(svg.documentElement);
        png = Viz.svgXmlToPngImageElement(document.getElementById('graph').innerHTML);
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


function addFileExtension(filename, ext) {
    var re=/(.*)(?:\.([^.]+$))/;
    var m = filename.match(re);
    if (m && m[2] === ext) {
        return filename;
    } else {
        return filename + "." + ext;
    }
}


document.getElementById('save_btn').addEventListener(
    'click',
    function () {
        var fileName = document.getElementById('fileName').textContent;
        var s = document.getElementById('fileFormat');
        var fileFormat = s.options[s.selectedIndex].value;
        s = document.getElementById('savePlace');
        var savePlace = s.options[s.selectedIndex].value;

        var promptResult = prompt('File Name', fileName);
        if (promptResult) {
            fileName = promptResult;
        } else {
            console.log("Input fileName canceled.");
            return;
        }
        fileName = addFileExtension(fileName, fileFormat);

        var content;
        var mimeType;
        switch (fileFormat) {
        case 'dot':
            content = editor.getSession().getDocument().getValue();
            mimeType = TEXT_MIME_TYPE;
            break;
        case 'svg':
            content = document.getElementById('graph').innerHTML;
            mimeType = SVG_MIME_TYPE
            break;
        case 'png':
            content = png.src;
            mimeType = PNG_MIME_TYPE;
            break;
        }


        switch(savePlace) {
        case 'local':
            if (fileFormat == 'dot' || fileFormat == 'svg') {
                // save file locally (text)
                var blob = new Blob([content],  {type: "text/plain;charset=utf-8"});
                saveAs(blob, fileName);
            } else if (fileFormat == 'png') {
                var download = document.createElement('a');
                download.href = png.src;
                download.download = fileName;
                download.click();
            }
            break;
        case 'gdrive':
            if (fileFormat == 'png') {
                // console.log(content);
                var buf = content.split(',')[1];
                writeFileToGDrive(fileName + ".png", buf, mimeType);
            } else {
                writeFileToGDrive(fileName, content, mimeType);
            }
            break;
        }
    }
);



function createPicker() {
    if (pickerApiLoaded && oauthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.DOCS).
            setOAuthToken(oauthToken).
            setDeveloperKey(DEVELOPER_KEY).
            setCallback(pickerCallback).
            build();
        picker.setVisible(true);
    }
}

var doc;

// A simple callback implementation.
function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        doc = data[google.picker.Response.DOCUMENTS][0];
        loadFileFromGDrive(doc.id);
    }
}

document.getElementById('open_btn').addEventListener(
    'click',
    function () {
        createPicker();
    }
);

drawGraph();
