// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");

//const child_spawn = require("child_process").spawn;

// Modules for ffmpeg control
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const math = require("mathjs");

// since external exe file is called
// g_devMode must be set to true to develope
// while false for building
const g_devMode = true;
const g_devTool = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressWindow;
let infoWindow;

// Winodws init
function initWindows() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 700, height: 550 });

    // and load the index.html of the app.
    mainWindow.loadFile("./app/html/index.html");

    // create menu
    var menu = Menu.buildFromTemplate([
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
                    label: "Exit",
                    click() {
                        app.quit();
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    // Open the DevTools.
    if (g_devTool) {
        mainWindow.webContents.openDevTools({ mode: "bottom" });
    }

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
// and execute ffmepg to encode
ipcMain
    .on("submit-form", (event, encInfo) => {

        
        let ffmpeg_bin;
        let newJob;

        if (g_devMode) {
            ffmpeg_bin = path.join(__dirname, "..", "tools");
        } else {
            ffmpeg_bin = path.join(__dirname, "..", "..", "tools");
        }

        ffmpeg.setFfmpegPath(path.join(ffmpeg_bin, "ffmpeg.exe"));
        ffmpeg.setFfprobePath(path.join(ffmpeg_bin, "ffprobe.exe"));
        
        if (encInfo.preview) {
            newJob = createFfmpegJobPreview(encInfo);

        } else {
            newJob = createFfmpegJob(encInfo);
        }

        launchEncoding(newJob);
    });
    


/* Interrupt an encoding process */
function interruptEnc(ffmpegProc) {
    if (ffmpegProc != null) {
        ffmpegProc.kill("SIGTERM");        
    }

    progressWindow = null;
    mainWindow.webContents.send("enc-term");
}

/* Dispaly application infomation */
function displayAppInfo() {
    infoWindow = new BrowserWindow({ width: 450, height: 210, parent: mainWindow, modal: true, show: false });
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
function launchEncoding(newJob) {
    /* create progress window */
    progressWindow = new BrowserWindow({ width: 340, height: 300, parent: mainWindow, modal: true, show: false });
    progressWindow.setMenuBarVisibility(false);
    //progressWindow.setMinimizable(false);
    progressWindow.setMaximizable(false);
    progressWindow.loadFile("./app/html/showProgress.html");

    /* event showProgress window closed handler */
    progressWindow.on("closed", function() {
        interruptEnc(newJob);
        progressWindow = null;
    });

    ipcMain.on("enc-cancel", (event) => {        
        interruptEnc(newJob);
    });

    /* loading finished, do execute ffmpeg */
    progressWindow.webContents.on("did-finish-load", () => {
        if (g_devTool) {
            progressWindow.webContents.openDevTools({ mode: "bottom" });
        }

        progressWindow.show();

        try {
            newJob.run();
        } 
        catch(err) {
            dialog.showErrorBox("無法開始任務", "請檢查輸入路徑與檔案格式");
            progressWindow.close();
            mainWindow.webContents.send("enc-term");
        }   
    });
}

function createFfmpegJobPreview(encInfo) {
    let newJob = ffmpeg(encInfo.src);
    let ffmpegOpt;
    let in_fps;

    newJob.ffprobe((err, data) => {
        if (err) {
            console.error(err);
        } else {
            in_fps = math.ceil(eval(data.streams[0].r_frame_rate));            

            console.log("Preview");

            ffmpegOpt = [
                "-c:v libvpx-vp9",
                "-b:v 0",
                "-c:a libopus",
                "-b:a 192k",
                "-g " + in_fps * 10,
                "-tile-columns 2",
                "-tile-rows 0",
                "-threads 4",
                "-row-mt 1",
                "-frame-parallel 1",
                "-qmin 4",
                "-qmax 48",
                "-deadline realtime",
                "-cpu-used 6",
                "-y"
            ];

            newJob
                .output(encInfo.des)
                .outputOptions(ffmpegOpt)
                .on("error", (err) => {
                    console.log(err);
                })
                .on("start", cmdLine => {
                    console.log("Spawned FFmpeg with command: " + cmdLine);
                    progressWindow.send("launch-first-pass");
                })
                .on("codecData", codecData => {
                    progressWindow.webContents.send(
                        "update-duration",
                        codecData.duration
                    );
                })
                .on("progress", progress => {
                    console.log(progress);
                    if (progressWindow != null) {
                        
                        progressWindow.webContents.send(
                            "update-timemark",
                            progress.timemark
                        );
                        progressWindow.webContents.send(
                            "update-percent",
                            progress.percent
                        );
                    }
                })                
                .on("end", () => {
                    if (progressWindow) {
                        progressWindow.close();
                    }                    
                    mainWindow.webContents.send("enc-term");
                });
        }
    });

    return newJob;
}



function createFfmpegJob(encInfo) {

    let newJob = ffmpeg(encInfo.src);
    let ffmpegOpt;
    let in_fps;

    newJob.ffprobe((err, data) => {
        if (err) {
            console.error(err);
        } else {
            in_fps = math.ceil(eval(data.streams[0].r_frame_rate));            

            console.log("Pass 1");
             /* Pass 1 */
            ffmpegOpt = [
                "-c:v libvpx-vp9",
                "-b:v 0",
                "-c:a libopus",
                "-b:a 192k",
                "-g " + in_fps * 10,
                "-tile-columns 2",
                "-tile-rows 0",
                "-threads 4",
                "-row-mt 1",
                "-frame-parallel 1",
                "-qmin 0",
                "-qmax 63",
                "-deadline good",
                "-crf 18",
                "-pass 1",
                "-cpu-used 4",
                "-passlogfile " + "passlog",
                "-y"
            ];

            newJob
                .output(encInfo.des)
                .outputOptions(ffmpegOpt)
                .on("error", (err) => {
                    console.log(err);
                })
                .on("start", cmdLine => {
                    console.log("Spawned FFmpeg with command: " + cmdLine);
                    progressWindow.send("launch-first-pass");
                })
                .on("codecData", codecData => {
                    progressWindow.webContents.send(
                        "update-duration",
                        codecData.duration
                    );
                })
                .on("progress", progress => {
                    console.log(progress);
                    if (progressWindow != null) {
                        
                        progressWindow.webContents.send(
                            "update-timemark",
                            progress.timemark
                        );
                        progressWindow.webContents.send(
                            "update-percent",
                            progress.percent
                        );
                    }
                })                
                .on("end", () => {
                    console.log("Pass 2");
                    /* Pass 2 */
                    
                    let passTwoJob = ffmpeg(encInfo.src);
                    passTwoJob.output(encInfo.des);
                    
                    /**
                     * TODO: Need refactoring
                     * 
                     * fluent-ffmpeg doesn't support two-pass very well.
                     * I have to do the 2nd pass with callback and fetch 
                     * the oother child_process. To interrupt the 2nd child_process, 
                     * copy&paste duped code is used here (the two listener below) 
                     * or the main process cannot interrput it.
                     */
                    progressWindow.on("closed", function() {
                        interruptEnc(passTwoJob);
                        progressWindow = null;
                    });
                    ipcMain.on("enc-cancel", (event) => {
                        interruptEnc(passTwoJob);
                    });
                    
                    ffmpegOpt = [
                        "-c:v libvpx-vp9",
                        "-b:v 0",
                        "-c:a libopus",
                        "-b:a 192k",
                        "-g " + in_fps * 10,
                        "-tile-columns 2",
                        "-tile-rows 0",
                        "-threads 4",
                        "-row-mt 1",
                        "-frame-parallel 1",
                        "-qmin 0",
                        "-qmax 63",
                        "-deadline good",
                        "-crf 18",
                        "-pass 2",
                        "-cpu-used " + encInfo.cpuUsed,
                        "-passlogfile " + "passlog",
                        "-y"
                    ];
        
                    if (encInfo.deinterlace && encInfo.denoise) {
                        ffmpegOpt.push("-vf yadif=0:-1:0,bm3d");
                    } else if (encInfo.deinterlace) {
                        ffmpegOpt.push("-vf yadif=0:-1:0");
                    } else if (encInfo.denoise) {
                        ffmpegOpt.push("-vf hqdn3d");
                    }


                    passTwoJob
                        .outputOptions(ffmpegOpt)
                        .on("error", err => {
                            //dialog.showErrorBox("Error", err.message);
                            console.log(err);
                        })
                        .on("start", cmdLine => {
                            console.log("Spawned FFmpeg with command: " + cmdLine);
                            progressWindow.send("launch-second-pass");
                        })
                        .on("codecData", codecData => {
                            progressWindow.webContents.send(
                                "update-duration",
                                codecData.duration
                            );
                        })
                        .on("progress", progress => {
                            console.log(progress);
                            if (progressWindow != null) {
                                
                                progressWindow.webContents.send(
                                    "update-timemark",
                                    progress.timemark
                                );
                                progressWindow.webContents.send(
                                    "update-percent",
                                    progress.percent
                                );
                            }
                        })
                        .on("end", () => {
                            if (progressWindow) {
                                progressWindow.close();
                            }
                            
                            mainWindow.webContents.send("enc-term");
                        })
                        .run();                    
                });
        }
    });

    return newJob;

}