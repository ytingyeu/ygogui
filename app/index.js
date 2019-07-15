// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, remote } = require("electron");
const { dialog } = remote;
const form = document.getElementById("encoding-form");

const supFileExtension = ["avs", "avi", "mp4", "mkv"];

const btns = {
    src: document.getElementById("btn-select-src"),
    des: document.getElementById("btn-select-des"),
    submit: document.getElementById("btn-encode")
};

const inputs = {
    src: form.querySelector('input[name="src"]'),
    des: form.querySelector('input[name="des"]'),
    cpuUsed: form.querySelector('input[name="cpu-used"]'),
    deinterlace: form.querySelector('input[name="deinterlace"]'),
    denoise: form.querySelector('input[name="denoise"]'),
    preview: form.querySelector('input[name="preview"]'),
    afterEncoding: form.querySelector('select[name="after-encoding"]')
};

/* get source path */
btns.src.addEventListener("click", () => {
    const inputPath = dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "All Supported", extensions: supFileExtension }]
    });
    if (inputPath) {
        inputs.src.value = inputPath.toString();
    }
});

/* get output path and filename */
btns.des.addEventListener("click", () => {
    const outputPath = dialog.showSaveDialog({
        filters: [{ name: "WebM file", extensions: ["webm"] }]
    });
    if (outputPath) {
        inputs.des.value = outputPath;
    }
});

document.getElementById("preview").addEventListener("change", event => {
    if (event.target.checked) {
        document.getElementById("cpu-used").disabled = true;
    } else {
        document.getElementById("cpu-used").disabled = false;
    }
});

/* Get src path by drag & drop */
(function handleDropFile() {
    var holder = document.getElementById("input-src");

    holder.ondragover = () => {
        return false;
    };

    holder.ondragleave = () => {
        return false;
    };

    holder.ondragend = () => {
        return false;
    };

    holder.ondrop = e => {
        e.preventDefault();

        if (e.dataTransfer.files.length == 1) {
            let f = e.dataTransfer.files[0];
            let fileExtension = f.path.split(".").pop();
            
            if (supFileExtension.includes(fileExtension)) {
                let refInputPath = document.getElementById("input-src");
                refInputPath.innerHTML = f.path;
                inputs.src.value = f.path;
            }
        }

        return false;
    };
})();

/* Submit form to main process */
form.addEventListener("submit", event => {
    event.preventDefault();
    document.getElementById("btn-encode").disabled = true;
    ipcRenderer.send("submit-form", {
        src: inputs.src.value,
        des: inputs.des.value,
        cpuUsed: inputs.cpuUsed.value,
        deinterlace: inputs.deinterlace.checked,
        denoise: inputs.denoise.checked,
        preview: inputs.preview.checked,
        afterEncoding: inputs.afterEncoding.value
    });
});

ipcRenderer.on("enable-btn-encode", () => {
    document.getElementById("btn-encode").disabled = false;
});
