# 바탕화면 "해카 카테고리" 폴더의 그림을 512px JPEG으로 줄여 해카 저장소 img/ 에 넣는다
Add-Type -AssemblyName System.Drawing

$src  = "C:\Users\xxx\Desktop\해카 카테고리"
$dst  = "C:\Users\xxx\HAEKA-repo\img"
$slug = @{
  '식당'='restaurant'; '카페'='cafe'; '편의점'='convenience'; '마트'='mart';
  '숙박'='hotel'; '쇼핑'='shopping'; '관광'='tour'; '교통'='transport';
  '기타'='etc'; '펍'='pub'; '입장권'='ticket'; '패스트푸드'='fastfood';
  '이자카야'='izakaya'; 'ATM기'='atm'; '버스'='bus'; '호텔'='hotel';
  '전철티켓'='metro'; '전철 티켓'='metro';
  '술집'='sooljip'; 'ATM'='atm'
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82

$map = @()
Get-ChildItem "$src\*" -Include *.png,*.jpg,*.jpeg | ForEach-Object {
  $ko = $_.BaseName
  $name = $slug[$ko]
  if (-not $name) { $name = $ko }   # 매핑에 없으면 이름 그대로
  $out = Join-Path $dst "cat-$name.jpg"

  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $bmp = New-Object System.Drawing.Bitmap 512,512
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($img, 0, 0, 512, 512)
  $g.Dispose(); $img.Dispose()
  $bmp.Save($out, $codec, $ep); $bmp.Dispose()

  $kb = [math]::Round((Get-Item $out).Length/1KB)
  "$ko -> cat-$name.jpg  ${kb}KB"
  $map += """$ko"": ""img/cat-$name.jpg"""
}

# 각 화면의 CAT_IMAGES 목록을 새로 쓴다
$line = 'var CAT_IMAGES = { ' + ($map -join ', ') + ' };'
$line | Set-Content "C:\Users\xxx\AppData\Local\Temp\claude\C--Users-xxx\461ad4f7-6207-4928-9b4b-31e988b1c2ed\scratchpad\cat-line.txt" -Encoding utf8
""
"CAT_IMAGES 갱신용 줄:"
$line
