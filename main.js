// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const child_spawn = require('child_process').spawn;

// globel variables
const g_devMode = true;  //set to false before building
let g_vDuration;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  if (g_devMode) {
    mainWindow.webContents.openDevTools({ mode: "bottom" })
  };

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if (progressWindow) {
      progressWindow.close()
    }
    mainWindow = null
  });
};

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
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


/* 
* get the path of input/output from mainWindow 
* and execute ffmepg to encode
*/
function handleSubmit() {
  ipcMain.on('submit-form', (event, encInfo) => {

    //console.log(encInfo);

    let ffmpegPath;

    if (g_devMode) {
      ffmpegPath = __dirname + '\\tools\\ffmpeg32.exe';
    } else {
      ffmpegPath = __dirname + '\\..\\tools\\ffmpeg32.exe';
    }

    let ffmpegOptions = [
      '-i', encInfo.src,
      '-y', '-threads', '8', '-speed', '2', '-tile-columns', '6',
      '-c:v', 'libvpx-vp9', '-b:v', '0', '-frame-parallel', '1',
      '-c:a', 'libopus', '-b:a', '192k'
    ];

    switch (encInfo.resolution) {
      case '1080':
        ffmpegOptions.push('-crf');
        ffmpegOptions.push('31');
        break;
      case '1440':
        ffmpegOptions.push('-crf');
        ffmpegOptions.push('24');
        break;
      case '2160':
        ffmpegOptions.push('-crf');
        ffmpegOptions.push('15');
        break;
      default:
        ffmpegOptions.push('-crf');
        ffmpegOptions.push('33');
        break;
    }

    if (encInfo.deinterlace && encInfo.denoise ) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('yadif=0:-1:0,bm3d');
    } else if (encInfo.deinterlace) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('yadif=0:-1:0');
    } else if (encInfo.denoise) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('bm3d');
    }

    ffmpegOptions.push(encInfo.des);

    console.log(encInfo.deinterlace);
    console.log(encInfo.denoise);
    console.log(ffmpegOptions);

    progressWindow = new BrowserWindow({ width: 400, height: 300 });
    progressWindow.loadFile('showProgress.html');

    progressWindow.webContents.on('did-finish-load', () => {

      if (g_devMode) {
        progressWindow.webContents.openDevTools({ mode: "bottom" });
      }

      /* spawn child process for ffmpeg */
      const encProc = child_spawn(ffmpegPath, ffmpegOptions);

      /* Handle ffmpeg stderr */
      encProc.stderr.on('data', (data) => {
        handleFFmpegMsg(`${data}`);
      });

      /* event the end of ffmpeg process handler*/
      encProc.on('close', (code) => {
        //console.log(`child process exited with code ${code}`);

        if (progressWindow) {
          progressWindow.close();
        }
        mainWindow.webContents.send('enc-term');
      });

      /* event showProgress window closed handler */
      progressWindow.on('closed', function () {
        interruptEnc(encProc);
      });

      /* event showProgress window btn-cancel clicked handler */
      ipcMain.on('enc-cancel', function () {
        interruptEnc(encProc);
      });
    });
  });
}

/* 
 * parse video duration and encoding progress from stderr
 * and send to progress window
*/
function handleFFmpegMsg(msg) {

  console.log(msg);

  let parseRes = msg.match(/\d*\:\d*\:\d*\.\d*/g);

  if (parseRes != null && progressWindow != null) {
    // the first matched case is the duration
    // else are encoding progress
    if (g_vDuration == null) {
      g_vDuration = parseRes[0];
      progressWindow.webContents.send('update-duration', g_vDuration);

    } else {
      progressWindow.webContents.send('update-progress', parseRes[0]);
    }
  }
}

/* interrupt encoind process and reset relative variables */
function interruptEnc(encProc) {
  progressWindow = null;
  g_vDuration = null;

  if (encProc != null) {
    encProc.kill('SIGTERM');
  }
}