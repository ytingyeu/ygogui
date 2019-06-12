# YgoGUI

## 這是什麼?
提供 **國立中央大學動畫社-影像編輯研究** 使用的圖形化 VP9/OPUS 轉檔軟體；
為統一社員作品格式，只具備最低限度的自訂選項與功能。
使用 `ffmpeg` 進行編碼，
支援的輸入格式除常見的 `avi, mp4, mkv` 外，
亦可搭配 [AviSynth](http://avisynth.nl/index.php/Main_Page) 使用 `avs` 腳本。


**注意！本專案目的是作業懶人化**，
有自定義需求的人建議使用 [Hybrid](http://www.selur.de/)
或 [HandBrake](https://handbrake.fr/)。


## 使用方式
[封裝版下載點](https://drive.google.com/open?id=1g34wUXLjQGFxyC69HEvggJvMcGHh-08j)
1. 執行 `ygogui.exe`
2. 拖曳或使用瀏覽按鈕指定來源影片或 `avs` 腳本
3. 使用瀏覽按鈕指定輸出路徑與檔名
4. 按下 Encode 按鈕並等待編碼完成


## ffmpeg 參數
```
ffmpeg32 -i src.avs -y -threads 4 -tile-columns 2 -deadline good -qmin 0 -qmax 63 -crf 18 -c:v libvpx-vp9 -frame-parallel 1 -b:v 0 -c:a libopus -b:a 192k out.webm
```

以下為選項：
* 編碼品質 vs 編碼速度：`-cpu-used` 可選範圍 0 - 2。數值越低品質越好、速度越慢
* 去交錯：`-vf yadif=0:-1:0,bm3d`。建議來源為非交錯影片時才勾選
* 降噪：`-vf hqdn3d`。建議來源有顆粒噪訊時才勾選


Ref: [VP9 Encoding Guide](http://wiki.webmproject.org/ffmpeg/vp9-encoding-guide) 與
[Recommended Settings for VOD](https://developers.google.com/media/vp9/settings/vod/)，
歡迎至 Issue 討論更佳的參數設定


## 注意事項
為了支援只有 32-bit 的官方版 `AviSynth`，
本專案所包含的 `ffmpeg` 也是使用 32-bit 版本


## License
[GPLv3](LICENSE.md)


