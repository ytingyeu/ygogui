const { ipcRenderer, remote } = require('electron');

let refBtnCancel = document.getElementById("btn-cancel");
let refShowProgress = document.getElementById('show-progress');
let refShowDuration = document.getElementById('show-duration');

ipcRenderer.on('update-progress', (event, arg) => {
    refShowProgress.innerHTML = arg
});

ipcRenderer.on('update-duration', (event, arg) => {
    refShowDuration.innerHTML = arg;
});

refBtnCancel.addEventListener('click', () => {
    if (confirm('Are you sure?')) {
        ipcRenderer.send('enc-cancel');
        remote.getCurrentWindow().close();
    }
});

