'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TEXT_MIME_TYPE = 'text/plain';
var SVG_MIME_TYPE = 'image/svg+xml';
var PNG_MIME_TYPE = 'image/png';

// The Browser API key obtained from the Google Developers Console.
var DEVELOPER_KEY = 'AIzaSyAI5grPt2ETORNhZp05lB950crIyNlffCc';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = "1027551625677-9582c548i7072iih701rp3a0aeua98jg.apps.googleusercontent.com";

//var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.install'];

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

/*
 * from http://ecmanaut.blogspot.jp/2006/07/encoding-decoding-utf8-in-javascript.html
 */
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

/*
 * 拡張子追加
 */
function addFileExtension(filename, ext) {
    var re = /(.*)(?:\.([^.]+$))/;
    var m = filename.match(re);
    if (m && m[2] === ext) {
        return filename;
    } else {
        return filename + "." + ext;
    }
}

var oauthToken = false;
var drive_files = {}; // Key : value = File, Data?

var GoogleDriveAdapter = function () {
    function GoogleDriveAdapter() {
        _classCallCheck(this, GoogleDriveAdapter);

        this.pickerApiLoaded = false;
        this.metadataRequest = null;
        this.contentRequest = null;
        this.response = null;
        // Use the API Loader script to load google.picker and gapi.auth.
        this.onApiLoad = function () {
            //  window.gapi.load('auth', {'callback': onAuthApiLoad});
            window.gapi.load('picker', { 'callback': onPickerApiLoad });
        };
    }

    /**
     * Handle response from authorization server.
     *
     * @param {Object} authResult Authorization result.
     */


    _createClass(GoogleDriveAdapter, [{
        key: 'handleAuthResult',
        value: function handleAuthResult(authResult) {
            var authorizeDiv = document.getElementById('login_btn');
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
    }, {
        key: 'onAuthApiLoad',
        value: function onAuthApiLoad() {
            window.gapi.auth.authorize({
                'client_id': clientId,
                'scope': SCOPES.join(' '),
                'immediate': false
            }, this.handleAuthResult);
        }
    }, {
        key: 'onPickerApiLoad',
        value: function onPickerApiLoad() {
            pickerApiLoaded = true;
        }

        /**
         * Check if current user has authorized this application.
         */

    }, {
        key: 'checkAuth',
        value: function checkAuth() {
            console.log("checkAuth");
            gapi.auth.authorize({
                'client_id': CLIENT_ID,
                'scope': SCOPES.join(' '),
                'immediate': true
            }, this.handleAuthResult);
        }

        /**
         * Initiate auth flow in response to user clicking authorize button.
         *
         * @param {Event} event Button click event.
         */

    }, {
        key: 'handleAuthClick',
        value: function handleAuthClick(event) {
            gapi.auth.authorize({
                client_id: CLIENT_ID,
                scope: SCOPES,
                immediate: false
            }, this.handleAuthResult);
            return false;
        }

        /**
         * Insert new file.
         *
         * @param {fileName} 保存するファイル名
         * @param {content} 保存するファイルの内容
         * @param {Function} callback Function to call when the request is complete.
         */

    }, {
        key: 'insertFile',
        value: function insertFile(fileName, content, contentType, callback) {
            var boundary = '-------314159265358979323846';
            var delimiter = "\r\n--" + boundary + "\r\n";
            var close_delim = "\r\n--" + boundary + "--";

            var metadata = {
                'title': fileName,
                'mimeType': contentType
            };

            var base64Data = void 0;
            if (contentType == PNG_MIME_TYPE) {
                base64Data = content;
            } else {
                base64Data = utf8_to_b64(content);
            }
            console.log(base64Data);
            var multipartRequestBody = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + contentType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + base64Data + close_delim;

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
            };
            if (drive_files[fileName]) {
                request_arg['path'] = '/upload/drive/v2/files/' + encodeURIComponent(drive_files[fileName].id);
                request_arg['method'] = 'PUT';
            }
            var request = gapi.client.request(request_arg);
            if (!callback) {
                callback = function callback(response) {
                    alert("保存しました");
                    //console.log("response=" + response);
                    var metadata = response.id;
                    drive_files[fileName] = response;
                    //console.log(drive_files);
                };
            }
            request.execute(callback);
        }

        /**
         * Start the file upload.
         *
         * @param {Object} evt Arguments from the file selector.
         */

    }, {
        key: 'writeFileToGDrive',
        value: function writeFileToGDrive(fileName, content, contentType) {
            var f = this.insertFile;
            gapi.client.load('drive', 'v2', function () {
                f(fileName, content, contentType);
            });
        }

        // load .dot file

    }, {
        key: 'loadFileFromGDrive',
        value: function loadFileFromGDrive(fileId) {
            gapi.client.load('drive', 'v3', function () {
                //metadataRequest = gapi.client.drive.files.get({
                //    fileId: fileId,
                //    fields: DEFAULT_FIELDS
                //});
                contentRequest = gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }).then(function (resp) {
                    response = resp;
                    editor.getSession().setValue(resp.body);
                });
            });
        }

        /**
         * Show Google Drive Open File Dialog a.k.a Picker
         */

    }, {
        key: 'createPicker',
        value: function createPicker() {
            if (this.pickerApiLoaded && this.oauthToken) {
                var picker = new google.picker.PickerBuilder().addView(google.picker.ViewId.DOCS).setOAuthToken(this.oauthToken).setDeveloperKey(DEVELOPER_KEY).setCallback(pickerCallback).build();
                picker.setVisible(true);
            }
        }

        // A simple callback implementation.

    }, {
        key: 'pickerCallback',
        value: function pickerCallback(data) {
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];
                loadFileFromGDrive(doc.id);
            }
        }
    }, {
        key: 'init',
        value: function init() {
            var _this = this;

            document.getElementById('save_btn').addEventListener('click', function () {
                var fileName = document.getElementById('fileName').value;
                console.log(fileName);
                var s = document.getElementById('fileFormat');
                var fileFormat = s.options[s.selectedIndex].value;
                s = document.getElementById('savePlace');
                var savePlace = s.options[s.selectedIndex].value;
                console.log('savePlace:' + savePlace);

                var promptResult = prompt('File Name', fileName);
                if (promptResult) {
                    fileName = promptResult;
                } else {
                    console.log("Input fileName canceled.");
                    return;
                }
                fileName = addFileExtension(fileName, fileFormat);
                console.log('added filename: ' + fileName);

                var content = void 0;
                var mimeType = void 0;
                switch (fileFormat) {
                    case 'dot':
                        content = EDITOR_INSTANCE.getEditorSession().getDocument().getValue();
                        mimeType = TEXT_MIME_TYPE;
                        break;
                    case 'svg':
                        content = document.getElementById('graph').innerHTML;
                        mimeType = SVG_MIME_TYPE;
                        break;
                    case 'png':
                        content = png.src;
                        mimeType = PNG_MIME_TYPE;
                        break;
                }
                console.log('content');
                console.log(content);
                console.log('mimeType');
                console.log(mimeType);

                switch (savePlace) {
                    case 'local':
                        if (fileFormat == 'dot' || fileFormat == 'svg') {
                            // save file locally (text)
                            var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                            saveAs(blob, fileName);
                        } else if (fileFormat == 'png') {
                            var download = document.createElement('a');
                            download.href = png.src;
                            download.download = fileName;
                            download.click();
                        }
                        break;
                    case 'Google Drive':
                        if (fileFormat == 'png') {
                            // console.log(content);
                            var buf = content.split(',')[1];
                            _this.writeFileToGDrive(fileName + ".png", buf, mimeType);
                        } else {
                            _this.writeFileToGDrive(fileName, content, mimeType);
                        }
                        break;
                }
            });

            // google drive open button
            document.getElementById('open_btn').addEventListener('click', function () {
                createPicker();
            });
        }
    }]);

    return GoogleDriveAdapter;
}();

var INSTANCE = new GoogleDriveAdapter();
INSTANCE.init();

function checkAuth() {
    INSTANCE.checkAuth();
}

function onApiLoad() {
    INSTANCE.onApiLoad();
}