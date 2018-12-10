// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote, shell } = require('electron');
const { dialog } = remote;
const form = document.querySelector('form');

const btns = {
    src: document.getElementById('selectSrc'),
    des: document.getElementById('selectDes'),
    submit: form.querySelector('button[type="submit"]'),
};

const inputs = {
    src: form.querySelector('input[name="src"]'),
    des: form.querySelector('input[name="des"]')
};

btns.src.addEventListener('click', () => {
    const avsPath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'AviSynth scripts', extensions: ['avs'] }]
    });
    if (avsPath) {
        //console.log(avsPath)
        inputs.src.value = avsPath.toString();
    }
});

btns.des.addEventListener('click', () => {
    const outputPath = dialog.showSaveDialog({
        filters: [{ name: 'WebM file', extensions: ['webm'] }]
    });
    if (outputPath) {
        //console.log(outputPath)
        inputs.des.value = outputPath;
    }
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    ipcRenderer.send('submit-form', {
        src: inputs.src.value,
        des: inputs.des.value
    });
});



(function handleDropFile() {
    var holder = document.getElementById('avs-src');

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
                let refInputPath = document.getElementById('avs-src');
                refInputPath.innerHTML = f.path;
                inputs.src.value = f.path;
            }
        }

        return false;
    };
})();




