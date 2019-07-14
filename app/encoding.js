const ffmpeg = require("fluent-ffmpeg");
const math = require("mathjs");
const path = require("path");

let newJob;
let passTwoJob;

ipcRenderer.on('set-env', (evnet, ffmpeg_bin) => {
    ffmpeg.setFfmpegPath(path.join(ffmpeg_bin, "ffmpeg.exe"));
    ffmpeg.setFfprobePath(path.join(ffmpeg_bin, "ffprobe.exe"));    
    ipcRenderer.send('env-set-ready');
})

ipcRenderer.on('prepare-job', (event, encInfo) => {

    newJob = null;
    passTwoJob = null;

    if (encInfo.preview) {
        newJob = createFfmpegJobPreview(encInfo);

    } else {
        newJob = createFfmpegJob(encInfo);
    }

    ipcRenderer.send('job-ready');
});

ipcRenderer.on('run-job', () => {
    newJob.run();
});

ipcRenderer.on('interrupt-encoding', () => {
    if (passTwoJob != null) {
        passTwoJob.kill("SIGTERM")
    }

    if (newJob != null) {
        newJob.kill("SIGTERM");
    }

    ipcRenderer.send("enc-terminated");
})

function createFfmpegJobPreview(encInfo) {
    let newJob = ffmpeg(encInfo.src).output(encInfo.des);
    let ffmpegOpt;
    let in_fps;

    newJob.ffprobe((err, data) => {
        if (err) {
            console.log(err);
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
                "-threads 8",
                "-row-mt 1",
                "-frame-parallel 1",
                "-qmin 0",
                "-qmax 63",
                "-deadline realtime",
                "-cpu-used 6"
            ];

            newJob                
                .outputOptions(ffmpegOpt)
                .on("error", (err) => {
                    console.log(err);
                })
                .on("start", cmdLine => {
                    console.log("Spawned FFmpeg with command: " + cmdLine);
                    ipcRenderer.send("launch-first-pass");
                })
                .on("codecData", codecData => {
                    ipcRenderer.send(
                        "update-duration",
                        codecData.duration
                    );
                })
                .on("progress", progress => {
                        ipcRenderer.send(
                            "update-progress",
                            {
                                timemark: progress.timemark,
                                percent: progress.percent
                            }
                        );
                })
                .on("end", () => {                
                    ipcRenderer.send("enc-terminated");
                });
        }
    });

    return newJob;
}



function createFfmpegJob(encInfo) {

    let newJob = ffmpeg(encInfo.src)
                    .addOption('-f', 'null')
                    .output('/dev/null');
                    
    let ffmpegOpt;
    let in_fps;
    console.log(encInfo.des);

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
                "-threads 8",
                "-row-mt 1",
                "-frame-parallel 1",
                "-qmin 0",
                "-qmax 63",
                "-deadline good",
                "-crf 18",
                "-pass 1",
                "-cpu-used 4",
                "-passlogfile " + "passlog"
            ];

            newJob                
                .outputOptions(ffmpegOpt)
                .on("error", (err) => {
                    console.log(err);
                })
                .on("start", cmdLine => {
                    console.log("Spawned FFmpeg with command: " + cmdLine);
                    ipcRenderer.send("launch-first-pass");
                })
                .on("codecData", codecData => {
                    ipcRenderer.send(
                        "update-duration",
                        codecData.duration
                    );
                })
                .on("progress", progress => {
                    //console.log(progress);
                    ipcRenderer.send(
                        "update-progress",
                        {
                            timemark: progress.timemark,
                            percent: progress.percent
                        }
                    );
                })                
                .on("end", () => {
                    console.log("Pass 2");
                    /* Pass 2 */
                    
                    passTwoJob = ffmpeg(encInfo.src).output(encInfo.des);
                    
                    /**
                     * TODO: Need refactoring
                     * 
                     * fluent-ffmpeg doesn't support two-pass very well.
                     * I have to do the 2nd pass with callback and fetch 
                     * the other child_process. 
                     * 
                     * To interrupt the 2nd child_process, 
                     * copy&paste duped code is used here (the two listener below) 
                     * or the main process cannot interrput it.
                     */
                   
                    ffmpegOpt = [
                        "-c:v libvpx-vp9",
                        "-b:v 0",
                        "-c:a libopus",
                        "-b:a 192k",
                        "-g " + in_fps * 10,
                        "-tile-columns 2",
                        "-tile-rows 0",
                        "-threads 8",
                        "-row-mt 1",
                        "-frame-parallel 1",
                        "-qmin 0",
                        "-qmax 63",
                        "-deadline good",
                        "-crf 18",
                        "-pass 2",
                        "-auto-alt-ref 1",
                        "-arnr-maxframes 7",
                        "-arnr-strength 5",
                        "-lag-in-frames 25",
                        "-cpu-used " + encInfo.cpuUsed,
                        "-passlogfile " + "passlog"
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
                            ipcRenderer.send("launch-second-pass");
                        })
                        .on("codecData", codecData => {
                            ipcRenderer.send(
                                "update-duration",
                                codecData.duration
                            );
                        })
                        .on("progress", progress => {
                            //console.log(progress);
                            ipcRenderer.send(
                                "update-progress",
                                {
                                    timemark: progress.timemark,
                                    percent: progress.percent
                                }
                            );
                        }) 
                        .on("end", () => {
                            ipcRenderer.send("enc-terminated");
                        })
                        .run();
                });
        }
    });

    return newJob;

}
