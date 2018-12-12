const { ipcRenderer, remote } = require('electron');

let refBtnCancel = document.getElementById("btn-cancel");

/* ISSUE:
 * the msg progressWindow.webContents.send('update-duration', [arg, ]) send
 * is never caught by pcRenderer.on('update-duration'...
 * but ipcRenderer.on('update-progress'... is good
*/

ipcRenderer.on('update-duration', (event, arg) => {
    console.log('update-duration');
});


ipcRenderer.on('update-progress', (event, time, duration) => {
    //console.log(arg);
    let refShowProgress = document.getElementById('show-progress');
    refShowProgress.innerHTML = time + ' / ' + duration;
});


refBtnCancel.addEventListener('click', () => {
    if (confirm('Are you sure?')) {
        ipcRenderer.send('enc-cancel');
        remote.getCurrentWindow().close();
    }
});

