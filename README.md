# ncuacg-enc

## 這是什麼?
由台灣國立中央大學動畫社很閒的 OB 所開發的 VP9/OPUS 圖形化轉檔軟體，
除了讓社團 AMV 成品能更方便地使用次世代的格式儲存外，
更重要的是達到輸出格式在一定程度上的統一

## 事前準備
1. 下載並安裝 [AviSynth 2.6](http://avisynth.nl/index.php/Main_Page)
2. (選)下載並安裝 [Debugmode FrameServer](http://www.debugmode.com/frameserver/)

## 使用方式
1. 撰寫 avs 腳本
2. (選)準備 frameServing avi
3. 執行 `ncuacg-enc.exe`
4. 拖曳或使用瀏覽按鈕指定目標 avs 腳本
5. 使用瀏覽按鈕指定輸出路徑與檔名
6. 按下 Submit 按鈕並等待編碼完成

## 實際上使用的編碼方式
```
ffmpeg32 -i src.avs -y -threads 8 -speed 4 -quality good -tile-columns 2 -c:v libvpx-vp9 -crf 18 -b:v 0 -c:a libopus -b:a 192k out.webm
```
Ref: [Recommended Settings for VOD](https://developers.google.com/media/vp9/settings/vod/)

## 注意事項
官方版 AviSynth 只支援 x86，因此 `ffmpeg` 等工具也必須使用 x86 版本。封裝版所包含的皆為 x86

## 封裝版下載連結
[GoogleDrive](https://drive.google.com/file/d/1qYJW6W7JDv-cIN1zJm9tD23oc8qh_JDW/view)

## License
[GPLv3](LICENSE.md)

