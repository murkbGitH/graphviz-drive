const TEXT_MIME_TYPE    = 'text/plain';
const SVG_MIME_TYPE     = 'image/svg+xml';
const PNG_MIME_TYPE     = 'image/png';

// The Browser API key obtained from the Google Developers Console.
const DEVELOPER_KEY = 'AIzaSyAI5grPt2ETORNhZp05lB950crIyNlffCc';

// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
const CLIENT_ID = "1027551625677-9582c548i7072iih701rp3a0aeua98jg.apps.googleusercontent.com";

//var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.install'];


const DEFAULT_FILE = {
    content: 'DEFAULT_FILE DAYO',
    metadata: {
        id: null,
        title: 'untitled.txt',
        mimeType: 'text/plain',
        editable: true
    }
};

const DEFAULT_FIELDS = 'id,title,mimeType,userPermission,editable,copyable,shared,fileSize';

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
    let re=/(.*)(?:\.([^.]+$))/;
    let m = filename.match(re);
    if (m && m[2] === ext) {
        return filename;
    } else {
        return filename + "." + ext;
    }
}


let oauthToken = false;
class GoogleDriveAdapter {
    constructor() {
        this.pickerApiLoaded = false;
        this.metadataRequest = null;
        this.contentRequest = null;
        this.response = null;
        this.drive_files = {}; // Key : value = File, Data?
        // Use the API Loader script to load google.picker and gapi.auth.
        this.onApiLoad = () => {
            //  window.gapi.load('auth', {'callback': onAuthApiLoad});
            window.gapi.load('picker', {'callback': onPickerApiLoad});
        }

        /**
         * Handle response from authorization server.
         *
         * @param {Object} authResult Authorization result.
         */
        this.handleAuthResult = (authResult) => {
            let authorizeDiv = document.getElementById('login_btn');
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
         * Insert new file.
         *
         * @param {fileName} 保存するファイル名
         * @param {content} 保存するファイルの内容
         * @param {Function} callback Function to call when the request is complete.
         */
        this.insertFile = (fileName, content, contentType, callback) => {
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            let metadata = {
                'title': fileName,
                'mimeType': contentType
            };

            let base64Data;
            if (contentType == PNG_MIME_TYPE) {
                base64Data = content;
            } else {
                base64Data = utf8_to_b64(content);
            }
            console.log(base64Data);
            let multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

            let request_arg = {
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

            let drive_files = this.drive_files;
            if (drive_files[fileName]) {
                request_arg['path'] = '/upload/drive/v2/files/' +
                               encodeURIComponent(drive_files[fileName].id);
                request_arg['method'] = 'PUT';
            }
            let request = gapi.client.request(request_arg);
            if(!callback) {
                callback = (response) => {
                    alert("保存しました");
                    //console.log("response=" + response);
                    let metadata = response.id;
                    drive_files[fileName] = response;
                    //console.log(drive_files);
                };
            }
            request.execute(callback);
        }

        this.onAuthApiLoad = () => {
            window.gapi.auth.authorize(
                {
                    'client_id': clientId,
                    'scope': SCOPES.join(' '),
                    'immediate': false
                },
                this.handleAuthResult);
        }

        this.onPickerApiLoad = () => {
            this.pickerApiLoaded = true;
        }

        /**
         * Check if current user has authorized this application.
         */
        this.checkAuth = () => {
            console.log("checkAuth");
            gapi.auth.authorize(
                {
                    'client_id': CLIENT_ID,
                    'scope': SCOPES.join(' '),
                    'immediate': true
                },
                this.handleAuthResult
            );
        }

        /**
         * Initiate auth flow in response to user clicking authorize button.
         *
         * @param {Event} event Button click event.
         */
        this.handleAuthClick = (event) => {
            gapi.auth.authorize(
                {
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    immediate: false
                },
                this.handleAuthResult
            );
            return false;
        }

        /**
         * Start the file upload.
         *
         * @param {Object} evt Arguments from the file selector.
         */
        this.writeFileToGDrive = (fileName, content, contentType) => {
            const insertFile = this.insertFile;
            gapi.client.load('drive', 'v2', () => {
                insertFile(fileName,content, contentType);
            });
        }

        /*
         * load .dot file
         */
        this.loadFileFromGDrive = (fileId) => {
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

        /**
         * Show Google Drive Open File Dialog a.k.a Picker
         */
        this.createPicker = () => {
            if (this.pickerApiLoaded && this.oauthToken) {
                let picker = new google.picker.PickerBuilder().
                addView(google.picker.ViewId.DOCS).
                setOAuthToken(this.oauthToken).
                setDeveloperKey(DEVELOPER_KEY).
                setCallback(pickerCallback).
                build();
                picker.setVisible(true);
            }
        }

        // A simple callback implementation.
        this.pickerCallback = (data) => {
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                let doc = data[google.picker.Response.DOCUMENTS][0];
                loadFileFromGDrive(doc.id);
            }
        }

        this.init = () => {
            document.getElementById('save_btn').addEventListener(
                'click',
                () => {
                    let fileName = document.getElementById('fileName').value;
                    console.log(fileName);
                    let s = document.getElementById('fileFormat');
                    let fileFormat = s.options[s.selectedIndex].value;
                    s = document.getElementById('savePlace');
                    let savePlace = s.options[s.selectedIndex].value;
                    console.log('savePlace:' + savePlace);

                    let promptResult = prompt('File Name', fileName);
                    if (promptResult) {
                        fileName = promptResult;
                    } else {
                        console.log("Input fileName canceled.");
                        return;
                    }
                    fileName = addFileExtension(fileName, fileFormat);
                    console.log('added filename: ' + fileName);

                    let content;
                    let mimeType;
                    switch (fileFormat) {
                    case 'dot':
                        console.log('file format dot');
                        content = EDITOR_INSTANCE.getEditorSession()
                            .getDocument()
                            .getValue();
                        mimeType = TEXT_MIME_TYPE;
                        break;
                    case 'svg':
                        console.log('file format svg');
                        content = document.getElementById('viewer').innerHTML;
                        mimeType = SVG_MIME_TYPE
                        break;
                    case 'png':
                        console.log('file format png');
                        // TODO use callback for get content
                        mimeType = PNG_MIME_TYPE;
                        break;
                    }
                    console.log('content');
                    console.log(content);
                    console.log('mimeType');
                    console.log(mimeType);

                    let dotdata = document.getElementById('viewer').innerHTML;

                    switch(savePlace) {
                    case 'local':
                        if (fileFormat == 'dot' || fileFormat == 'svg') {
                            // save file locally (text)
                            let blob = new Blob([content],  {type: "text/plain;charset=utf-8"});
                            saveAs(blob, fileName);
                        } else if (fileFormat == 'png') {
                            Viz.svgXmlToPngBase64(
                                dotdata,
                                1,
                                (err, data) => {
                                    let download = document.createElement('a');
                                    download.href = data;
                                    download.download = fileName;
                                    download.click();
                                }
                            );
                        }
                        break;
                    case 'Google Drive':
                        if (fileFormat == 'png') {
                            Viz.svgXmlToPngBase64(
                                dotdata,
                                1,
                                (err, data) => {
                                    this.writeFileToGDrive(fileName, data, mimeType);
                                }
                            );
                        } else {
                            this.writeFileToGDrive(fileName, content, mimeType);
                        }
                        break;
                    }
                }
            );

            // google drive open button
            document.getElementById('open_btn').addEventListener(
                'click',
                () => {
                    createPicker();
                }
            );
        }
    }
}

let GDRIVER_ADAPTER_INSTANCE = new GoogleDriveAdapter();
GDRIVER_ADAPTER_INSTANCE.init();

function checkAuth() {
    GDRIVER_ADAPTER_INSTANCE.checkAuth();
}

function onApiLoad() {
    GDRIVER_ADAPTER_INSTANCE.onApiLoad();
}
