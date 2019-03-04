const { ipcRenderer, remote } = require('electron');

let refBtnCancel = document.getElementById("btn-cancel");
let refShowProgress = document.getElementById('show-progress');
let refShowDuration = document.getElementById('show-duration');
let refProcessGif = document.getElementById('process-gif');


ipcRenderer.on('update-progress', (event, arg) => {
    refShowProgress.innerHTML = arg;

    if (refProcessGif.style.display === "none") {
        refProcessGif.style.display = "block";
    }
});

ipcRenderer.on('update-duration', (event, arg) => {
    refShowDuration.innerHTML = arg;
});

refBtnCancel.addEventListener('click', () => {
    if (confirm('Are you sure?')) {
        refProcessGif.style.display = "none";
        ipcRenderer.send('enc-cancel');
        remote.getCurrentWindow().close();
    }
});

