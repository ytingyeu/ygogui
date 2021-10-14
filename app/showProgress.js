const { ipcRenderer, remote } = require("electron");

let refBtnCancel = document.getElementById("btn-cancel");
let refShowTimemark = document.getElementById("show-timemark");
let refShowDuration = document.getElementById("show-duration");
let refMultiPassInfo = document.getElementById("multipass-info");
let refProgressBar = document.getElementById("progress-bar");

ipcRenderer.on("launch-first-pass", () => {
    refMultiPassInfo.innerHTML = "1st Pass";
});

ipcRenderer.on("launch-second-pass", () => {
    refMultiPassInfo.innerHTML = "2nd Pass";
});

ipcRenderer.on("update-timemark", (event, arg) => {
    //console.log("update-timemark");
    refShowTimemark.innerHTML = arg;
});

ipcRenderer.on("update-percent", (event, percent) => {
    //console.log("percent: " + percent);
    if (percent) {
        refProgressBar.style.width = percent.toFixed(2) + "%";
    }
});

ipcRenderer.on("update-duration", (event, arg) => {
    refShowDuration.innerHTML = arg;
});

refBtnCancel.addEventListener("click", () => {
    if (confirm("Are you sure?")) {
        ipcRenderer.send("cancel-clicked");
        remote.getCurrentWindow().close();
    }
});
