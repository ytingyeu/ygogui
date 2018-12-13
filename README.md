# ncuacg-enc

## 這是什麼?
提供 **國立中央大學動畫社-影像編輯研究** 使用的圖形化 VP9/OPUS 轉檔軟體；
為統一社員作品格式，只具備最低限度的選項與功能。
使用 `ffmpeg` 進行編碼，
支援的輸入格式除常見的 `avi` 與 `mp4` 外，
亦可搭配 [AviSynth](http://avisynth.nl/index.php/Main_Page) 使用 `avs` 腳本。


## 使用方式
[封裝版下載點](https://drive.google.com/open?id=1tLliOzS1N9b9VTcBxUZCZRuRrBBMx9kk)
1. 執行 `ncuacg-enc.exe`
2. 拖曳或使用瀏覽按鈕指定來源影片或 `avs` 腳本
3. 使用瀏覽按鈕指定輸出路徑與檔名
4. 按下 Encode 按鈕並等待編碼完成

## ffmpeg 參數
```
ffmpeg32 -i src.avs -y -threads 8 -speed 4 -quality good -tile-columns 2 -c:v libvpx-vp9 -crf 18 -b:v 0 -c:a libopus -b:a 192k out.webm
```
Ref: [Recommended Settings for VOD](https://developers.google.com/media/vp9/settings/vod/)，
歡迎提供更佳的參數設定

## 注意事項
為了支援只有 x86 的官方版 `AviSynth`，
本專案所包含的 `ffmpeg` 也是使用 x86 版本

## License
[GPLv3](LICENSE.md)

