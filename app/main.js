// Modules to control application life and create native browser window
const electron = require("electron");
const { app, BrowserWindow, ipcMain, Menu, dialog } = electron;

const path = require("path");
const shutdown = require("electron-shutdown-command");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressWindow;
let infoWindow;

// main winodw init
function initWindows() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 660,
    height: 580,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '/mainPage/preload.js'),
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("./app/mainPage/index.html");

  // Windows going to shutdown
  mainWindow.on("session-end", () => {
    mainWindow.close();
  });

  // display main page after it is loaded
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
  });

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // create menu
  let mainMenu = Menu.buildFromTemplate([
    {
      label: "Menu",
      submenu: [
        {
          label: "Open DevTools",
          click() {
            mainWindow.webContents.openDevTools({
              mode: "undocked",
            });
          },
        },
        {
          label: "About",
          click() {
            displayAppInfo();
          },
        },
        {
          label: "Exit",
          click() {
            app.quit();
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(mainMenu);

  initWindows();

  // linux, macOS going to shutdown
  // for windows, see mainWindow 'session-end' event
  electron.powerMonitor.on("shutdown", () => {
    mainWindow.close();
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    initWindows();
  }
});

// get the path of input/output from mainWindow
ipcMain.on("submit-form", (event, encInfo) => {
  console.log(encInfo);  
  mainWindow.webContents.send("prepare-job", encInfo);
});

ipcMain.on("job-ready", () => {
  launchEncoding();
});

ipcMain.on("launch-first-pass", () => {
  progressWindow.send("launch-first-pass");
});

ipcMain.on("launch-second-pass", () => {
  progressWindow.send("launch-second-pass");
});

ipcMain.on("cancel-clicked", () => {
  if (progressWindow) {
    progressWindow.setClosable(true);
    progressWindow.close();
  }
  mainWindow.send("interrupt-encoding");
});

ipcMain.on("enc-end", (event, afterEncoding) => {
  if (progressWindow) {
    progressWindow.setClosable(true);
    progressWindow.close();
  }
  mainWindow.send("enable-btn-encode");

  // action after encoding
  switch (afterEncoding) {
    case "nothing":
      break;

    case "sleep":
      if (process.platform === "win32") {
        shutdown.hibernate();
      } else if (process.platform === "darwin") {
        shutdown.sleep();
      }
      break;

    case "shutdown":
      shutdown.shutdown();
      break;

    default:
      throw new Error("unknown action option");
  }
});

ipcMain.on("update-duration", (event, duration) => {
  if (progressWindow) {
    progressWindow.webContents.send("update-duration", duration);
  }
});

ipcMain.on("update-progress", (event, data) => {
  if (progressWindow) {
    progressWindow.webContents.send("update-timemark", data.timemark);
    progressWindow.webContents.send("update-percent", data.percent);
  }
});

/* Dispaly application infomation */
function displayAppInfo() {
  infoWindow = new BrowserWindow({
    width: 450,
    height: 210,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  infoWindow.setMenuBarVisibility(false);
  infoWindow.setMinimizable(false);
  infoWindow.setMaximizable(false);
  infoWindow.loadFile("./app/infoPage/info.html");

  infoWindow.webContents.on("did-finish-load", () => {
    infoWindow.show();
    infoWindow.webContents.send("app-version", app.getVersion());
  });

  infoWindow.on("closed", function () {
    infoWindow = null;
  });
}

/*Launch an pending encoding job */
function launchEncoding() {
  /* create progress window */
  progressWindow = new BrowserWindow({
    width: 340,
    height: 300,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  progressWindow.setMenuBarVisibility(false);
  progressWindow.setMaximizable(false);
  progressWindow.setClosable(false);
  progressWindow.loadFile("./app/html/showProgress.html");

  // macOS does NOT support win.setMenu()
  if (process.platform === "linux" || process.platform === "win32") {
    progressWindow.setMenuBarVisibility(true);
    let progressMenu = Menu.buildFromTemplate([
      {
        label: "Menu",
        submenu: [
          {
            label: "Open DevTools",
            click() {
              progressWindow.webContents.openDevTools({
                mode: "undocked",
              });
            },
          },
        ],
      },
    ]);
    progressWindow.setMenu(progressMenu);
  }

  /* event showProgress window closed handler */
  progressWindow.on("closed", function () {
    progressWindow = null;
  });

  /* loading finished, execute ffmpeg and handle progress info */
  progressWindow.webContents.on("did-finish-load", () => {
    progressWindow.show();

    /* Start ffmpeg job */
    try {
      mainWindow.webContents.send("run-job");
    } catch (err) {
      dialog.showErrorBox("Error", err.message);
      progressWindow.close();
      mainWindow.webContents.send("enc-terminated");
    }
  });
}
