# Generate distinct PNG icons for each Plethora Office desktop app (Windows taskbar)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$apps = @(
  @{ folder = "slack";  letter = "R"; color = [System.Drawing.Color]::FromArgb(255, 97, 31, 105) },
  @{ folder = "scout";  letter = "S"; color = [System.Drawing.Color]::FromArgb(255, 245, 158, 11) },
  @{ folder = "draft";  letter = "D"; color = [System.Drawing.Color]::FromArgb(255, 45, 106, 79) },
  @{ folder = "grid";   letter = "G"; color = [System.Drawing.Color]::FromArgb(255, 8, 145, 178) },
  @{ folder = "trace";  letter = "T"; color = [System.Drawing.Color]::FromArgb(255, 124, 58, 237) },
  @{ folder = "nook";   letter = "N"; color = [System.Drawing.Color]::FromArgb(255, 234, 88, 12) },
  @{ folder = "mail";   letter = "M"; color = [System.Drawing.Color]::FromArgb(255, 37, 99, 235) }
)

$root = $PSScriptRoot

foreach ($app in $apps) {
  $dir = Join-Path $root $app.folder
  $build = Join-Path $dir "build"
  if (-not (Test-Path $dir)) { continue }
  New-Item -ItemType Directory -Path $build -Force | Out-Null

  $size = 256
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $rect = New-Object System.Drawing.Rectangle 8, 8, ($size - 16), ($size - 16)
  $brush = New-Object System.Drawing.SolidBrush $app.color
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = 48
  $path.AddArc($rect.X, $rect.Y, $r, $r, 180, 90)
  $path.AddArc($rect.Right - $r, $rect.Y, $r, $r, 270, 90)
  $path.AddArc($rect.Right - $r, $rect.Bottom - $r, $r, $r, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $r, $r, $r, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)

  $font = New-Object System.Drawing.Font("Segoe UI", 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($app.letter, $font, [System.Drawing.Brushes]::White, ($size / 2), ($size / 2 + 4), $sf)

  $out = Join-Path $build "icon.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Created $out"
  $g.Dispose(); $bmp.Dispose()
}

Write-Host "Done - restart apps to see new taskbar icons."
