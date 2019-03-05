// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote, shell } = require('electron');
const { dialog } = remote;
const form = document.querySelector('form');

const supFileExtension = ['avs', 'avi', 'mp4', 'mkv'];

const btns = {
    src: document.getElementById('selectSrc'),
    des: document.getElementById('selectDes'),
    submit: form.querySelector('button[type="submit"]'),
};

const inputs = {
    src: form.querySelector('input[name="src"]'),
    des: form.querySelector('input[name="des"]'),
    //resolution: form.querySelector('input[name="resolution"]'),
    deinterlace: form.querySelector('input[name="deinterlace"]'),
    denoise: form.querySelector('input[name="denoise"]')
};


/* get source path */
btns.src.addEventListener('click', () => {
    const avsPath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'All Supported', extensions: supFileExtension }            
        ]
    });
    if (avsPath) {
        inputs.src.value = avsPath.toString();
    }
});

/* get output path and filename */
btns.des.addEventListener('click', () => {
    const outputPath = dialog.showSaveDialog({
        filters: [{ name: 'WebM file', extensions: ['webm'] }]
    });
    if (outputPath) {
        inputs.des.value = outputPath;
    }
});

/* Get src path by drag & drop */
(function handleDropFile() {
    var holder = document.getElementById('input-src');

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

            // TO-DO: fix extension validation
            if (supFileExtension.includes(fileExtension)) {
                let refInputPath = document.getElementById('input-src');
                refInputPath.innerHTML = f.path;
                inputs.src.value = f.path;
            }
        }

        return false;
    };
})();

/* Submit form to main process */
form.addEventListener('submit', (event) => {
    event.preventDefault();
    document.getElementById("btn-encode").disabled = true;
    ipcRenderer.send('submit-form', {
        src: inputs.src.value,
        des: inputs.des.value,
        //resolution: inputs.resolution.value,
        deinterlace: inputs.deinterlace.checked,
        denoise: inputs.denoise.checked
    });
});

ipcRenderer.on('enc-term', (event, arg) => {
    document.getElementById("btn-encode").disabled = false;
});

