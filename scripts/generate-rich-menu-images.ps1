$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path $PSScriptRoot "..\\assets\\line"

function New-Text {
  param([int[]]$CodePoints)

  return (-join ($CodePoints | ForEach-Object { [char]$_ }))
}

$sectionNames = @(
  (New-Text @(0x8CB7, 0x3046, 0x3082, 0x306E)),
  (New-Text @(0x3084, 0x308B, 0x3053, 0x3068))
)

$labelChooseAction = New-Text @(0x64CD, 0x4F5C, 0x3092, 0x9078, 0x3076)
$labelShow = New-Text @(0x4E00, 0x89A7, 0x3092, 0x898B, 0x308B)
$labelAdd = New-Text @(0x8FFD, 0x52A0, 0x3059, 0x308B)
$labelComplete = New-Text @(0x5B8C, 0x4E86, 0x3059, 0x308B)
$labelEdit = New-Text @(0x7DE8, 0x96C6, 0x3059, 0x308B)
$labelDelete = New-Text @(0x524A, 0x9664, 0x3059, 0x308B)
$labelCancel = New-Text @(0x30AD, 0x30E3, 0x30F3, 0x30BB, 0x30EB)
$labelShowList = New-Text @(0x4E00, 0x89A7, 0x3092, 0x898B, 0x308B)
$labelShowAll = New-Text @(0x5168, 0x90E8, 0x898B, 0x308B)

$stateMenus = @(
  @{
    FileName = "list-rich-menu.png"
    Header = (New-Text @(0x30EA, 0x30B9, 0x30C8, 0x8868, 0x793A))
    Accent = [System.Drawing.Color]::FromArgb(66, 135, 245)
  },
  @{
    FileName = "add-rich-menu.png"
    Header = (New-Text @(0x8FFD, 0x52A0, 0x5148, 0x3092, 0x9078, 0x3076))
    Accent = [System.Drawing.Color]::FromArgb(39, 110, 241)
  },
  @{
    FileName = "edit-rich-menu.png"
    Header = (New-Text @(0x7DE8, 0x96C6, 0x5148, 0x3092, 0x9078, 0x3076))
    Accent = [System.Drawing.Color]::FromArgb(238, 132, 34)
  },
  @{
    FileName = "complete-rich-menu.png"
    Header = (New-Text @(0x5B8C, 0x4E86, 0x5148, 0x3092, 0x9078, 0x3076))
    Accent = [System.Drawing.Color]::FromArgb(26, 147, 111)
  },
  @{
    FileName = "delete-rich-menu.png"
    Header = (New-Text @(0x524A, 0x9664, 0x5148, 0x3092, 0x9078, 0x3076))
    Accent = [System.Drawing.Color]::FromArgb(201, 65, 90)
  }
)

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-CenteredStringFormat {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  return $format
}

function Draw-CenteredText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )

  $format = New-CenteredStringFormat

  try {
    $layout = New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)
    $Graphics.DrawString($Text, $Font, $Brush, $layout, $format)
  }
  finally {
    $format.Dispose()
  }
}

function New-MainRichMenuImage {
  param([string]$OutputPath)

  $width = 2500
  $height = 1686
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(16, 19, 26))

    $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 255))
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(21, 25, 36))
    $panelStroke = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(40, 64, 77, 104), 2)
    $showBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 44, 59))
    $addBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 48, 56))
    $completeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(31, 49, 43))
    $editBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(74, 56, 28))
    $deleteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(74, 37, 45))
    $buttonBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 255))
    $accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(58, 115, 240))
    $decorBrushA = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 58, 115, 240))
    $decorBrushB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 255, 184, 76))

    $titleFont = New-Object System.Drawing.Font("Yu Gothic UI", 52, [System.Drawing.FontStyle]::Bold)
    $primaryFont = New-Object System.Drawing.Font("Yu Gothic UI", 66, [System.Drawing.FontStyle]::Bold)
    $secondaryFont = New-Object System.Drawing.Font("Yu Gothic UI", 54, [System.Drawing.FontStyle]::Bold)

    $graphics.FillRectangle($accentBrush, 0, 0, 2500, 110)
    Draw-CenteredText -Graphics $graphics -Text $labelChooseAction -Font $titleFont -Brush $titleBrush -X 0 -Y 150 -Width 2500 -Height 130

    $showPath = New-RoundedRectanglePath -X 60 -Y 330 -Width 714 -Height 560 -Radius 44
    $addPath = New-RoundedRectanglePath -X 893 -Y 330 -Width 714 -Height 560 -Radius 44
    $completePath = New-RoundedRectanglePath -X 1726 -Y 330 -Width 714 -Height 560 -Radius 44
    $panelPath = New-RoundedRectanglePath -X 60 -Y 980 -Width 1690 -Height 580 -Radius 44
    $editPath = New-RoundedRectanglePath -X 1860 -Y 980 -Width 480 -Height 262 -Radius 36
    $deletePath = New-RoundedRectanglePath -X 1860 -Y 1298 -Width 480 -Height 262 -Radius 36

    $graphics.FillPath($showBrush, $showPath)
    $graphics.FillPath($addBrush, $addPath)
    $graphics.FillPath($completeBrush, $completePath)
    $graphics.FillPath($panelBrush, $panelPath)
    $graphics.DrawPath($panelStroke, $panelPath)
    $graphics.FillPath($editBrush, $editPath)
    $graphics.FillPath($deleteBrush, $deletePath)

    $graphics.FillEllipse($decorBrushA, 170, 1090, 420, 420)
    $graphics.FillEllipse($decorBrushA, 520, 1160, 250, 250)
    $graphics.FillEllipse($decorBrushB, 1110, 1020, 320, 320)
    $graphics.FillEllipse($decorBrushB, 1370, 1260, 190, 190)

    Draw-CenteredText -Graphics $graphics -Text $labelShow -Font $primaryFont -Brush $buttonBrush -X 60 -Y 330 -Width 714 -Height 560
    Draw-CenteredText -Graphics $graphics -Text $labelAdd -Font $primaryFont -Brush $buttonBrush -X 893 -Y 330 -Width 714 -Height 560
    Draw-CenteredText -Graphics $graphics -Text $labelComplete -Font $primaryFont -Brush $buttonBrush -X 1726 -Y 330 -Width 714 -Height 560
    Draw-CenteredText -Graphics $graphics -Text $labelEdit -Font $secondaryFont -Brush $buttonBrush -X 1860 -Y 980 -Width 480 -Height 262
    Draw-CenteredText -Graphics $graphics -Text $labelDelete -Font $secondaryFont -Brush $buttonBrush -X 1860 -Y 1298 -Width 480 -Height 262

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    if ($null -ne $showPath) { $showPath.Dispose() }
    if ($null -ne $addPath) { $addPath.Dispose() }
    if ($null -ne $completePath) { $completePath.Dispose() }
    if ($null -ne $panelPath) { $panelPath.Dispose() }
    if ($null -ne $editPath) { $editPath.Dispose() }
    if ($null -ne $deletePath) { $deletePath.Dispose() }
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function New-RichMenuImage {
  param(
    [string]$OutputPath,
    [string]$Header,
    [System.Drawing.Color]$Accent,
    [string[]]$SectionNames,
    [string]$RightBottomTitle
  )

  $width = 2500
  $height = 1686
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  try {
    $background = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 19, 26))
    $accentBrush = New-Object System.Drawing.SolidBrush $Accent
    $darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 244, 251))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(145, 154, 173))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 255))
    $graphics.Clear([System.Drawing.Color]::FromArgb(16, 19, 26))
    $graphics.FillRectangle($background, 0, 0, 2500, 1686)
    $graphics.FillRectangle($accentBrush, 0, 0, 2500, 110)

    $headerFont = New-Object System.Drawing.Font("Yu Gothic UI", 52, [System.Drawing.FontStyle]::Bold)
    $buttonFont = New-Object System.Drawing.Font("Yu Gothic UI", 42, [System.Drawing.FontStyle]::Bold)
    $sectionFont = New-Object System.Drawing.Font("Yu Gothic UI", 84, [System.Drawing.FontStyle]::Bold)

    $graphics.DrawString($Header, $headerFont, $darkBrush, 980, 165)

    $leftCardFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 36, 48))
    $rightCardFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25, 43, 45))
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
    $leftAccentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 184, 76))
    $rightAccentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(75, 201, 156))

    $leftShadowPath = New-RoundedRectanglePath -X 94 -Y 344 -Width 1110 -Height 560 -Radius 44
    $leftCardPath = New-RoundedRectanglePath -X 80 -Y 330 -Width 1110 -Height 560 -Radius 44
    $rightShadowPath = New-RoundedRectanglePath -X 1294 -Y 344 -Width 1110 -Height 560 -Radius 44
    $rightCardPath = New-RoundedRectanglePath -X 1280 -Y 330 -Width 1110 -Height 560 -Radius 44

    $graphics.FillPath($shadowBrush, $leftShadowPath)
    $graphics.FillPath($leftCardFill, $leftCardPath)
    $graphics.FillPath($shadowBrush, $rightShadowPath)
    $graphics.FillPath($rightCardFill, $rightCardPath)

    $graphics.FillEllipse($leftAccentBrush, 120, 380, 90, 90)
    $graphics.FillEllipse($rightAccentBrush, 1320, 380, 90, 90)

    $graphics.DrawString($SectionNames[0], $sectionFont, $darkBrush, 430, 500)
    $graphics.DrawString($SectionNames[1], $sectionFont, $darkBrush, 1630, 500)

    $cancelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50, 56, 70))
    $listBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(52, 110, 230))

    $cancelPath = New-RoundedRectanglePath -X 150 -Y 1130 -Width 970 -Height 320 -Radius 36
    $listPath = New-RoundedRectanglePath -X 1380 -Y 1130 -Width 970 -Height 320 -Radius 36

    $graphics.FillPath($cancelBrush, $cancelPath)
    $graphics.FillPath($listBrush, $listPath)

    $graphics.DrawString($labelCancel, $buttonFont, $whiteBrush, 470, 1230)
    $graphics.DrawString($RightBottomTitle, $buttonFont, $whiteBrush, 1680, 1230)

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    if ($null -ne $leftShadowPath) { $leftShadowPath.Dispose() }
    if ($null -ne $leftCardPath) { $leftCardPath.Dispose() }
    if ($null -ne $rightShadowPath) { $rightShadowPath.Dispose() }
    if ($null -ne $rightCardPath) { $rightCardPath.Dispose() }
    if ($null -ne $cancelPath) { $cancelPath.Dispose() }
    if ($null -ne $listPath) { $listPath.Dispose() }
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

New-MainRichMenuImage -OutputPath (Join-Path $assetDir "default-rich-menu.png")

foreach ($menu in $stateMenus) {
  $rightBottomTitle = $labelShowList

  if ($menu.FileName -eq "list-rich-menu.png") {
    $rightBottomTitle = $labelShowAll
  }

  New-RichMenuImage `
    -OutputPath (Join-Path $assetDir $menu.FileName) `
    -Header $menu.Header `
    -Accent $menu.Accent `
    -SectionNames $sectionNames `
    -RightBottomTitle $rightBottomTitle
}
