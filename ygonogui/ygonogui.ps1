function PressKey-Exit {
	Write-Host -NoNewLine 'Press any key to exit...';
	$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');
	Exit	
}

$rootFolder = Get-Location
$src_folder = "$rootFolder\source"
$out_folder = "$rootFolder\output"

if (!(Test-Path -Path $src_folder)) {
	New-Item -ItemType Directory -Path $src_folder
    Write-Host "No souce files found!"
	PressKey-Exit	
}

if (!(Test-Path -PathType container -Path $out_folder)) {
    New-Item -ItemType Directory -Path $out_folder
} 

$filelist = Get-Childitem -Path $src_folder

foreach ($file in $filelist) {
	
  if ($file.Name -Eq "SOURCE_FILE")
  {
	  continue
  }

  $srcPath = "$src_folder\{0}" -f $file.Name
  $outPath = "$out_folder\{0}.webm" -f $file.Basename

  try {
    $fpsString = ./ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate $srcPath
    $fpsArray = $fpsString.Split("/")
    $fps = [Math]::Ceiling($fpsArray[0] / $fpsArray[1])
    $gopSize = $fps * 10
  } catch {
    Write-Error $_
    break
  }
 
  $firstPassArgs = "-i $srcPath -c:v libvpx-vp9 -b:v 0 -c:a libopus -b:a 192k -g $gopSize -tile-columns 2 -tile-rows 0 -threads 8 -row-mt 1 -frame-parallel 1 -qmin 0 -qmax 63 -deadline good -crf 18 -pass 1 -cpu-used 4 -passlogfile passlog -y $outPath"
  $secondPassArgs = "-i $srcPath -c:v libvpx-vp9 -b:v 0 -c:a libopus -b:a 192k -g $gopSize -tile-columns 2 -tile-rows 0 -threads 8 -row-mt 1 -frame-parallel 1 -qmin 0 -qmax 63 -deadline good -crf 18 -pass 2 -auto-alt-ref 1  -arnr-maxframes 7 -arnr-strength 5 -lag-in-frames 25 -cpu-used 1 -passlogfile passlog -y $outPath"

  Write-Host "Start pass 1 with following params:"
  Write-Host -ForegroundColor Green -Object $firstPassArgs

  try {
    Start-Process -FilePath "./ffmpeg.exe" -ArgumentList $firstPassArgs -Wait -NoNewWindow
  } catch {
    Write-Error $_
    break
  }  

  Write-Host "Start pass 2 with following params:"
  Write-Host -ForegroundColor Green -Object $secondPassArgs;

  try {
    Start-Process -FilePath "./ffmpeg.exe" -ArgumentList $secondPassArgs -Wait -NoNewWindow
  } catch {
    Write-Error $_
    break
  }  
}

PressKey-Exit
