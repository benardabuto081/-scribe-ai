# TEMPORARY brand asset generator (flagged in docs/FEATURE_STATUS.md).
# Crops the S+feather mark out of app/src/assets/brand/logo.jpeg and converts
# the solid black background to transparency ("screen to alpha").
# No redrawing: every output pixel comes from the original JPEG.
# Replace with official transparent PNG/SVG assets when available.
param(
  [string]$Source = "$PSScriptRoot/../src/assets/brand/logo.jpeg",
  [string]$OutDir = "$PSScriptRoot/../src/assets/brand"
)
Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Source))
$scaleX = $src.Width / 1600.0
# Mark region measured on the 1600x533 master.
$rect = New-Object System.Drawing.Rectangle ([int](62 * $scaleX)), ([int](12 * $scaleX)), ([int](508 * $scaleX)), ([int](508 * $scaleX))
$crop = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

function Convert-ToAlpha([System.Drawing.Bitmap]$bmp) {
  $data = $bmp.LockBits((New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height),
    [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $len = $data.Stride * $bmp.Height
  $bytes = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $len)
  for ($i = 0; $i -lt $len; $i += 4) {
    $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
    $a = [Math]::Max($r, [Math]::Max($g, $b))
    if ($a -lt 18) { $bytes[$i + 3] = 0; continue }   # JPEG noise floor
    $bytes[$i]     = [byte][Math]::Min(255, [int]($b * 255 / $a))
    $bytes[$i + 1] = [byte][Math]::Min(255, [int]($g * 255 / $a))
    $bytes[$i + 2] = [byte][Math]::Min(255, [int]($r * 255 / $a))
    $bytes[$i + 3] = [byte]$a
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $len)
  $bmp.UnlockBits($data)
}

function Save-Resized([System.Drawing.Bitmap]$bmp, [int]$size, [string]$path) {
  $out = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($bmp, 0, 0, $size, $size)
  $g.Dispose()
  $out.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
}

# Opaque version (black tile) for app icons, transparent version for UI.
Save-Resized $crop 1024 "$OutDir/mark-tile.png"
Convert-ToAlpha $crop
Save-Resized $crop 256 "$OutDir/mark.png"
Save-Resized $crop 64 "$PSScriptRoot/../public/favicon.png"
$crop.Dispose(); $src.Dispose()
Write-Output "Wrote mark.png, mark-tile.png, favicon.png"
