// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");

// since external exe file is called
// g_devMode must be set to true to develope
// while false for building
const g_devMode = false;
const g_devTool = false;

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
        height: 560,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile("./app/html/index.html");

    // create menu
    let mainMenu = Menu.buildFromTemplate([
        {
            label: "Menu",
            submenu: [
                {
                    label: "About",
                    click() {
                        displayAppInfo();
                    }
                },
                {
                    label: "Open DevTools",
                    click() {                        
                        mainWindow.webContents.openDevTools({ mode: "undocked"});
                    }
                },
                {
                    label: "Exit",
                    click() {
                        app.quit();
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(mainMenu);

    // Open the DevTools.
    if (g_devTool) {
        mainWindow.webContents.openDevTools({ mode: "bottom"});
    }

    // after the main page is loaded, set ffmpeg path
    mainWindow.webContents.on('did-finish-load', () => {
        let ffmpeg_bin;

        if (g_devMode) {
            ffmpeg_bin = path.join(__dirname, "..", "tools");
        } else {
            ffmpeg_bin = path.join(__dirname, "..", "..", "tools");
        }
        mainWindow.webContents.send('set-env', ffmpeg_bin);
    });

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
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
    initWindows();
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        initWindows();
    }
});


// get the path of input/output from mainWindow
ipcMain.on('submit-form', (event, encInfo) => {    
    mainWindow.webContents.send('prepare-job', encInfo);
});

ipcMain.on('job-ready', () => {
    launchEncoding();
});

ipcMain.on('launch-first-pass', () => {
    progressWindow.send("launch-first-pass");
});

ipcMain.on('launch-second-pass', () => {
    progressWindow.send("launch-second-pass");
});

ipcMain.on('cancel-clicked', () => {
    mainWindow.send('interrupt-encoding');
});

ipcMain.on('enc-terminated', () => {
    if (progressWindow) {
        progressWindow.setClosable(true);
        progressWindow.close();
    }
    mainWindow.send('enable-btn-encode');
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
            nodeIntegration: true
        } 
    });
    infoWindow.setMenuBarVisibility(false);
    infoWindow.setMinimizable(false);
    infoWindow.setMaximizable(false);
    infoWindow.loadFile("./app/html/info.html");

    infoWindow.webContents.on("did-finish-load", () => {
        infoWindow.show();
        infoWindow.webContents.send("app-version", app.getVersion());
    });

    infoWindow.on("closed", function() {
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
        //show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    
    progressWindow.setMenuBarVisibility(false);
    progressWindow.setMaximizable(false);
    progressWindow.setClosable(false);
    progressWindow.loadFile("./app/html/showProgress.html");

    // macOS DOES NOT support win.setMenu()    
    if (process.platform === 'linux' || process.platform === 'win32') {
        progressWindow.setMenuBarVisibility(true);
        let progressMenu = Menu.buildFromTemplate([
            {
                label: "Menu",
                submenu: [
                    {
                        label: "Open DevTools",
                        click() {
                            progressWindow.webContents.openDevTools({ mode: "undocked" });
                        }
                    },
                ]
            }
        ]);
        progressWindow.setMenu(progressMenu);
    }
    

    /* event showProgress window closed handler */
    progressWindow.on("closed", function() {        
        progressWindow = null;
    });    

    /* loading finished, execute ffmpeg and handle progress info */
    progressWindow.webContents.on("did-finish-load", () => {
        if (g_devTool) {
            progressWindow.webContents.openDevTools({ mode: "bottom" });
        }

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

        /* Start ffmpeg job */
        try {
            mainWindow.webContents.send('run-job');            
        } 
        catch(err) {
            dialog.showErrorBox("Error", err.message);
            progressWindow.close();
            mainWindow.webContents.send("enc-terminated");
        }
    });
}



