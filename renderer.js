// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

(function handleDropFile () {
    var holder = document.getElementById('display-input-path');

    holder.ondragover = () => {
        return false;
    };

    holder.ondragleave = () => {
        return false;
    };

    holder.ondragend = () => {
        return false;
    };

    holder.ondrop = (e) => {
        e.preventDefault();

        if (e.dataTransfer.files.length == 1){
            let f = e.dataTransfer.files[0];
            let fileExtension = f.path.split('.').pop();

            if (fileExtension === 'avs'){
                let inputPath = document.getElementById("display-input-path");
            inputPath.innerHTML = f.path;
            }           
        }
      
        return false;
    };
})();

function getPathByDialog() {
    const app = require('electron').remote; 
    const dialog = app.dialog;

    let retPaths = dialog.showOpenDialog({ 
        properties: ['openFile'],
        filters: [{name: 'AviSynth Scripts', extensions: ['avs']}]
    });

    if (retPaths != null){
        let inputPath = document.getElementById("display-input-path");
        inputPath.innerHTML = retPaths[0];
    }

};

refBtnSelectFile = document.getElementById("btn-select-file");

refBtnAddToJob = document.getElementById("btn-select-file");
refBtnSelectFile.onclick = getPathByDialog;
