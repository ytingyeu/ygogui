// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const child = require('child_process').execFile;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow


function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode: "bottom" })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  handleSubmit();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()

  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function handleSubmit() {
  ipcMain.on('submit-form', (event, encInfo) => {


    let appPath = app.getAppPath()
    const executablePath = appPath + "\\tools\\ffmpeg32.exe";

    console.log(encInfo);
    console.log(executablePath);

    /*
    const parameters = [
      "-i ", source,
      "-y -threads 8 -speed 4 -quality good -tile-columns 2",
      "-c:v libvpx-vp9 -crf 18 -b:v 0 -c:a libopus -b:a 192k ",
      destination
    ];


    child(executablePath, parameters, function (err, data) {
      console.log(err)
      console.log(data.toString());
    });

    */

  });
}