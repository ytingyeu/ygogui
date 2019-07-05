# YgoGUI

## 這是什麼?
提供 **國立中央大學動畫社-影像編輯研究** 使用的圖形化介面 VP9/OPUS 轉檔軟體；
為統一社員作品格式，只具備最低限度的自訂選項與功能。
使用 `ffmpeg` 進行編碼，
支援的輸入格式除常見的 `avi, mp4, mkv` 外，
亦可搭配 [AviSynth](http://avisynth.nl/index.php/Main_Page) 使用 `avs` 腳本。


**注意！本專案目的是作業懶人化**，
有自定義需求的人建議使用 [Hybrid](http://www.selur.de/)
或 [HandBrake](https://handbrake.fr/)。


## 使用方式
1. 至 [發布頁面](https://github.com/ytingyeu/ygogui/releases)
   下載 `ygogui-<release-verison>-ia32-win.zip` 並解壓縮
2. 執行 `ygogui.exe`
3. 拖曳或使用瀏覽按鈕指定來源影片或 `avs` 腳本
4. 使用瀏覽按鈕指定輸出路徑與檔名
5. 按下 Encode 按鈕並等待編碼完成

## 建構資訊
1. 安裝最新版的 `Node.js` 並設置相關系統環境變數。雖然 Electron 官方建議使用 `yarn` 管理套件，但作者使用 `npm` 暫無發現影響
2. `git clone` 原始碼或下載壓縮檔
3. 於專案根目錄中，執行 `npm install`
4. 執行 `npm run dist` 來建構 Windows IA32 版本之執行檔
5. 本專案使用 `electron-builder` 建構，
   如有其他建構需求 (如非 Windows 平台)，請詳閱 [官方手冊](https://www.electron.build/configuration/configuration)
   並修改 `package.json` 當中的 `build` 參數及 `script` 的 `dist` 腳本

## ffmpeg 參數
### 一般轉檔 (2-Pass)
```
ffmpeg -i src.avs -c:v libvpx-vp9 -b:v 0 -c:a libopus -b:a 192k -g [fps*10] -tile-columns 2 -tile-rows 0 -threads 8 -row-mt 1 -frame-parallel 1 -qmin 0 -qmax 63 -deadline good -crf 18 -pass 1 -cpu-used 4 -passlogfile passlog -y out.webm
```
```
ffmpeg -i src.avs -c:v libvpx-vp9 -b:v 0 -c:a libopus -b:a 192k -g [fps*10] -tile-columns 2 -tile-rows 0 -threads 8 -row-mt 1 -frame-parallel 1 -qmin 0 -qmax 63 -deadline good -crf 18 -pass 2 -auto-alt-ref 1 -arnr-maxframes 7 -arnr-strength 5 -lag-in-frames 25 -cpu-used [0-2] -passlogfile passlog -y out.webm
```

### 快速輸出預覽用影片
```
ffmpeg -i src.avs -c:v libvpx-vp9 -b:v 0 -c:a libopus -b:a 192k -g [fps*10] -tile-columns 2 -tile-rows 0 -threads 8 -row-mt 1 -frame-parallel 1 -qmin 0 -qmax 63 -deadline realtime -cpu-used 6 -y out.webm
```

### 選項說明：
- 編碼品質 vs 編碼速度：`-cpu-used` 限制可選範圍 0 - 2。數值越低品質越好、速度越慢。
- 快速輸出預覽用：使用 1-pass 且 realtime 等級的參數；建議僅用來快速檢查畫面與字幕是否缺漏。
- 去交錯：`-vf yadif=0:-1:0,bm3d`；建議來源為非交錯影片時才勾選。
- 降噪：`-vf hqdn3d`；建議來源有顆粒噪訊時才勾選。


Ref: [VP9 Encoding Guide](http://wiki.webmproject.org/ffmpeg/vp9-encoding-guide) 與
[Recommended Settings for VOD](https://developers.google.com/media/vp9/settings/vod/)，
歡迎至 Issue 討論更佳的參數設定


## 注意事項
為了支援只有 32-bit 的官方版 `AviSynth`，本專案所包含的 `ffmpeg` 也是使用 32-bit 版本。

另外由於不少沒有持續更新的 codec，如 [Debugmode FrameServer](http://www.debugmode.com/frameserver/) 自定義的 DFSC，
並不支援 64-bit，因此作者在測試後決定本專案不會發布 64-bit 版本


## License
[GPL-3.0](LICENSE.md)


