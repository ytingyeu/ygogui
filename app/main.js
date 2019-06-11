// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const child_spawn = require('child_process').spawn;

// globel variables
let g_vDuration;

// since external exe file is called
// this variable must be set to true when developing
// while false for building
const g_debugMode = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressWindow;
let infoWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('./app/index.html');

  // create menu
  var menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        {
          label: 'About',
          click() {
            displayAppInfo();
          }
        },
        {
          label: 'Exit',
          click() {
            app.quit();
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu);


  // Open the DevTools.
  if (g_debugMode) {
    mainWindow.webContents.openDevTools({ mode: "bottom" });
  };

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if (progressWindow) {
      progressWindow.close();
    }

    if (infoWindow) {
      infoWindow.close();
    }
    
    mainWindow = null;
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

    let path = require('path');
    let ffmpegPath;
    let ffmpageFileName;
    let envArch = process.env.PROCESSOR_ARCHITECTURE;

    //console.log(envArch);
    
    if (envArch.includes("64")) {
      ffmpageFileName = "ffmpeg64.exe";
    } else {
      ffmpageFileName = "ffmpeg32.exe";
    }

    if (g_debugMode) {
      ffmpegPath = path.join(__dirname, 'tools', ffmpageFileName);
    } else {
      ffmpegPath = path.join(__dirname, "..", "..", 'tools', ffmpageFileName);
    }

    //console.log(ffmpegPath);

    let ffmpegOptions = [
      '-i', encInfo.src, '-y',
      '-threads', '4', '-tile-columns', '2',
      '-deadline', 'good',
      '-qmin', '0', '-qmax', '63',
      '-crf', '18',
      '-c:v', 'libvpx-vp9', '-b:v', '0', '-frame-parallel', '1',
      '-c:a', 'libopus', '-b:a', '192k',
    ];

    ffmpegOptions.push('-cpu-used');
    ffmpegOptions.push(encInfo.cpuUsed);

    if (encInfo.deinterlace && encInfo.denoise) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('yadif=0:-1:0,bm3d');
    } else if (encInfo.deinterlace) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('yadif=0:-1:0');
    } else if (encInfo.denoise) {
      ffmpegOptions.push('-vf');
      ffmpegOptions.push('hqdn3d');
    }

    ffmpegOptions.push(encInfo.des);

    if (g_debugMode) { console.log(ffmpegOptions); }

    progressWindow = new BrowserWindow({ width: 400, height: 300 });
    progressWindow.setMenuBarVisibility(false);
    progressWindow.setMinimizable(false);
    progressWindow.setMaximizable(false);
    progressWindow.loadFile('./app/showProgress.html');

    progressWindow.webContents.on('did-finish-load', () => {

      if (g_debugMode) {
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
        progressWindow = null;
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

  //console.log(msg);

  let parseDuration;
  let parseCurrTime;

  if (g_vDuration == null) {
    parseDuration = msg.match(/Duration\:\s*\d*\:\d*\:\d*\.\d*/g);

    if (parseDuration != null) {
      parseDuration = parseDuration[0].match(/\d*\:\d*\:\d*\.\d*/g);
    }
  }

  parseCurrTime = msg.match(/time\=\s*\d*\:\d*\:\d*\.\d*/g);

  if (parseCurrTime != null) {
    parseCurrTime = parseCurrTime[0].match(/\d*\:\d*\:\d*\.\d*/g);
  }

  if (progressWindow != null) {
    if (g_vDuration == null && parseDuration != null) {
      g_vDuration = parseDuration[0];
      progressWindow.webContents.send('update-duration', g_vDuration);
    }

    if (parseCurrTime != null) {
      progressWindow.webContents.send('update-progress', parseCurrTime[0]);
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

// development info
function displayAppInfo() {
  infoWindow = new BrowserWindow({ width: 350, height: 200 });
  infoWindow.setMenuBarVisibility(false);
  infoWindow.setMinimizable(false);
  infoWindow.setMaximizable(false);
  infoWindow.loadFile('./app/info.html');

  if (g_debugMode) {
    infoWindow.webContents.openDevTools({ mode: "bottom" });
  }

  infoWindow.webContents.on('did-finish-load', () => {
    infoWindow.webContents.send('app-version', app.getVersion());
  });

  infoWindow.on('closed', function() {
    infoWindow = null;
  });
}
