// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

let globalAvsPath = "";

(function handleDropFile() {
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

        if (e.dataTransfer.files.length == 1) {
            let f = e.dataTransfer.files[0];
            let fileExtension = f.path.split('.').pop();

            if (fileExtension === 'avs') {
                let refInputPath = document.getElementById("display-input-path");
                refInputPath.innerHTML = f.path;
                globalAvsPath = f.path;
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
        filters: [{ name: 'AviSynth Scripts', extensions: ['avs'] }]
    });

    if (retPaths != null) {
        let refInputPath = document.getElementById("display-input-path");
        refInputPath.innerHTML = retPaths[0];
        globalAvsPath = retPaths[0];
    }

};

function addToJob() {    

    if (globalAvsPath != null) {
        console.log(globalAvsPath);
    }

}

refBtnSelectFile = document.getElementById("btn-select-file");
refBtnAddToJob = document.getElementById("btn-add-to-job");

refBtnSelectFile.onclick = getPathByDialog;
refBtnAddToJob.onclick = addToJob;
