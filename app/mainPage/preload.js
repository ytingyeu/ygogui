const electron = require("electron");
const { app } = electron;

let ffmpeg_bin;

if (app.isPackaged) {
  ffmpeg_bin = path.join(__dirname, "..", "..", "..", "tools");
} else {
  ffmpeg_bin = path.join(__dirname, "..", "..", "tools");
}

window.ffmpeg = {
  path: ffmpeg_bin,
};
