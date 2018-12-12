// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const child_spawn = require('child_process').spawn;

// globel variables
let g_vDuration
const g_devMode = true

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  if (g_devMode) {
    mainWindow.webContents.openDevTools({ mode: "bottom" })
  }

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
    app.quit();
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();

  }
})


/* 
* get the path of input/output from mainWindow 
* and execute ffmepg to encode
*/
function handleSubmit() {
  ipcMain.on('submit-form', (event, encInfo) => {

    let ffmpegPath;

    if (g_devMode) {
      /* path for development */
      ffmpegPath = app.getAppPath() + '\\tools\\ffmpeg32.exe';
    } else {
      /* path for packeged app */
      ffmpegPath = app.getAppPath() + '\\..\\..\\tools\\ffmpeg32.exe';
    }

    const ffmpegOptions = [
      '-i', encInfo.src,
      '-y', '-threads', '8', '-speed', '4', '-quality', 'good', '-tile-columns', '2',
      '-c:v', 'libvpx-vp9', '-crf', '18', '-b:v', '0',
      '-c:a', 'libopus', '-b:a', '192k',
      encInfo.des
    ];

    progressWindow = new BrowserWindow({ width: 400, height: 300 });
    progressWindow.loadFile('showProgress.html');

    if (g_devMode) {
      progressWindow.webContents.openDevTools({ mode: "bottom" });
    }

    const encProc = child_spawn(ffmpegPath, ffmpegOptions);

    /* Handel ffmpeg info from stderr */
    encProc.stderr.on('data', (data) => {
      handleFFmpegMsg(`${data}`);
    });

    /* Handle the end of ffmpeg process */
    encProc.on('close', (code) => {
      //console.log(`child process exited with code ${code}`);

      if (progressWindow) {
        progressWindow.close();
      }      
      mainWindow.webContents.send('enc-term');
    });

    /* Handle showProgress window closed */
    progressWindow.on('closed', function () {
      progressWindow = null;
      g_vDuration = null
      encProc.kill('SIGTERM');
    });

    /* Handle showProgress window btn-cancel clicked */
    ipcMain.on('enc-cancel', function () {
      progressWindow = null;
      g_vDuration = null
      encProc.kill('SIGTERM');
    });
  });
}

/* 
 * parse video duration and encoding progress from stderr
 * and send to progress window
*/
function handleFFmpegMsg(msg) {

  let parseRes = msg.match(/\d*\:\d*\:\d*\.\d*/g);


  /* ISSUE:
   * the msg progressWindow.webContents.send('update-duration', [arg, ]) send
   * is never caught by showProgress.js
   * but progressWindow.webContents.send('update-progress', [arg, ]) is good
  */
  if (parseRes != null) {
    // the first matched case is the duration
    // else are encoding progress
    if (g_vDuration == null) {
      g_vDuration = parseRes[0];
      //progressWindow.webContents.send('update-duration', g_vDuration);
    } else if (progressWindow != null) {
      progressWindow.webContents.send('update-progress', parseRes[0], g_vDuration);
    }
  }
}


