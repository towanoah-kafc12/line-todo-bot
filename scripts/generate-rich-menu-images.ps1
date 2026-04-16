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

$uiFontFamily = "BIZ UDPGothic"

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
    $leftPanelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(24, 30, 41))
    $rightPanelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 34, 39))
    $showBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 73, 98))
    $addBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 92, 103))
    $editBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(111, 83, 41))
    $completeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(39, 112, 77))
    $buttonBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 255))
    $sectionFont = New-Object System.Drawing.Font($uiFontFamily, 86, [System.Drawing.FontStyle]::Bold)
    $buttonFont = New-Object System.Drawing.Font($uiFontFamily, 54, [System.Drawing.FontStyle]::Bold)

    $leftPanelPath = New-RoundedRectanglePath -X 80 -Y 150 -Width 1120 -Height 1360 -Radius 54
    $rightPanelPath = New-RoundedRectanglePath -X 1300 -Y 150 -Width 1120 -Height 1360 -Radius 54

    $graphics.FillPath($leftPanelBrush, $leftPanelPath)
    $graphics.FillPath($rightPanelBrush, $rightPanelPath)

    Draw-CenteredText -Graphics $graphics -Text $sectionNames[0] -Font $sectionFont -Brush $titleBrush -X 80 -Y 220 -Width 1120 -Height 180
    Draw-CenteredText -Graphics $graphics -Text $sectionNames[1] -Font $sectionFont -Brush $titleBrush -X 1300 -Y 220 -Width 1120 -Height 180

    $leftCards = @(
      @{ X = 160; Y = 460; Width = 960; Height = 220; Brush = $showBrush; Label = $labelShow },
      @{ X = 160; Y = 720; Width = 960; Height = 220; Brush = $addBrush; Label = $labelAdd },
      @{ X = 160; Y = 980; Width = 960; Height = 220; Brush = $editBrush; Label = $labelEdit },
      @{ X = 160; Y = 1240; Width = 960; Height = 220; Brush = $completeBrush; Label = $labelComplete }
    )
    $rightCards = @(
      @{ X = 1380; Y = 460; Width = 960; Height = 220; Brush = $showBrush; Label = $labelShow },
      @{ X = 1380; Y = 720; Width = 960; Height = 220; Brush = $addBrush; Label = $labelAdd },
      @{ X = 1380; Y = 980; Width = 960; Height = 220; Brush = $editBrush; Label = $labelEdit },
      @{ X = 1380; Y = 1240; Width = 960; Height = 220; Brush = $completeBrush; Label = $labelComplete }
    )

    foreach ($card in $leftCards + $rightCards) {
      $cardPath = New-RoundedRectanglePath -X $card.X -Y $card.Y -Width $card.Width -Height $card.Height -Radius 34

      try {
        $graphics.FillPath($card.Brush, $cardPath)
        Draw-CenteredText -Graphics $graphics -Text $card.Label -Font $buttonFont -Brush $buttonBrush -X $card.X -Y $card.Y -Width $card.Width -Height $card.Height
      }
      finally {
        $cardPath.Dispose()
      }
    }

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    if ($null -ne $leftPanelPath) { $leftPanelPath.Dispose() }
    if ($null -ne $rightPanelPath) { $rightPanelPath.Dispose() }
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
    $darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 244, 251))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(145, 154, 173))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 255))
    $graphics.Clear([System.Drawing.Color]::FromArgb(16, 19, 26))
    $graphics.FillRectangle($background, 0, 0, 2500, 1686)

    $headerFont = New-Object System.Drawing.Font($uiFontFamily, 52, [System.Drawing.FontStyle]::Bold)
    $buttonFont = New-Object System.Drawing.Font($uiFontFamily, 42, [System.Drawing.FontStyle]::Bold)
    $sectionFont = New-Object System.Drawing.Font($uiFontFamily, 84, [System.Drawing.FontStyle]::Bold)

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
