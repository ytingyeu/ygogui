const { ipcRenderer, remote } = require('electron');

let refBtnCancel = document.getElementById("btn-cancel");
let refShowProgress = document.getElementById('show-progress');
let refShowDuration = document.getElementById('show-duration');
let refProcessGif = document.getElementById('process-gif');
let refMultiPassInfo = document.getElementById('multipass-info');

ipcRenderer.on('launch-first-pass', () => {
    refMultiPassInfo.innerHTML = "1st Pass";

});

ipcRenderer.on('launch-second-pass', () => {
    refMultiPassInfo.innerHTML = "2nd Pass";
});


ipcRenderer.on('update-progress', (event, arg) => {
    refShowProgress.innerHTML = arg;
    
    if (refProcessGif.style.opacity !== "1") {
        refProcessGif.style.opacity = "1";
    }

});

ipcRenderer.on('update-duration', (event, arg) => {
    refShowDuration.innerHTML = arg;
});

refBtnCancel.addEventListener('click', () => {
    if (confirm('Are you sure?')) {
        refProcessGif.style.display = "0";
        ipcRenderer.send('enc-cancel');
        remote.getCurrentWindow().close();
    }
});

