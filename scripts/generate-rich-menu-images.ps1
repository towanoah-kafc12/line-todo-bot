$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path $PSScriptRoot "..\\assets\\line"

$menus = @(
  @{
    FileName = "add-rich-menu.png"
    Header = "追加中メニュー"
    Accent = [System.Drawing.Color]::FromArgb(39, 110, 241)
    Steps = @(
      "1. 買うもの / やること を選ぶ",
      "2. 続けてタスク名を送る",
      "キャンセルで通常メニューへ戻る"
    )
  },
  @{
    FileName = "edit-rich-menu.png"
    Header = "編集中メニュー"
    Accent = [System.Drawing.Color]::FromArgb(238, 132, 34)
    Steps = @(
      "1. 買うもの / やること を選ぶ",
      "2. 一覧の番号を送る",
      "3. 続けて新しい内容を送る"
    )
  },
  @{
    FileName = "complete-rich-menu.png"
    Header = "完了中メニュー"
    Accent = [System.Drawing.Color]::FromArgb(26, 147, 111)
    Steps = @(
      "1. 買うもの / やること を選ぶ",
      "2. 一覧の番号を送る",
      "3. その番号のタスクを完了する"
    )
  },
  @{
    FileName = "delete-rich-menu.png"
    Header = "削除中メニュー"
    Accent = [System.Drawing.Color]::FromArgb(201, 65, 90)
    Steps = @(
      "1. 買うもの / やること を選ぶ",
      "2. 一覧の番号を送る",
      "3. その番号のタスクを削除する"
    )
  }
)

function New-RichMenuImage {
  param(
    [string]$OutputPath,
    [string]$Header,
    [System.Drawing.Color]$Accent,
    [string[]]$Steps
  )

  $width = 2500
  $height = 1686
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  try {
    $background = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 244, 234))
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 252, 246))
    $accentBrush = New-Object System.Drawing.SolidBrush $Accent
    $darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(43, 38, 34))
    $mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(101, 92, 84))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $graphics.Clear([System.Drawing.Color]::FromArgb(248, 244, 234))
    $graphics.FillRectangle($panelBrush, 80, 80, 2340, 920)
    $graphics.FillRectangle($accentBrush, 80, 80, 26, 920)

    $headerFont = New-Object System.Drawing.Font("Yu Gothic UI", 58, [System.Drawing.FontStyle]::Bold)
    $leadFont = New-Object System.Drawing.Font("Yu Gothic UI", 24, [System.Drawing.FontStyle]::Regular)
    $stepFont = New-Object System.Drawing.Font("Yu Gothic UI", 38, [System.Drawing.FontStyle]::Bold)
    $buttonFont = New-Object System.Drawing.Font("Yu Gothic UI", 42, [System.Drawing.FontStyle]::Bold)
    $buttonSubFont = New-Object System.Drawing.Font("Yu Gothic UI", 23, [System.Drawing.FontStyle]::Regular)

    $graphics.DrawString($Header, $headerFont, $darkBrush, 160, 130)
    $graphics.DrawString("会話の途中だけこのメニューに切り替わるよ", $leadFont, $mutedBrush, 165, 235)

    $y = 360
    foreach ($step in $Steps) {
      $graphics.DrawString($step, $stepFont, $darkBrush, 170, $y)
      $y += 120
    }

    $cancelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(77, 69, 60))
    $listBrush = New-Object System.Drawing.SolidBrush $Accent

    $graphics.FillRectangle($cancelBrush, 0, 1080, 1250, 606)
    $graphics.FillRectangle($listBrush, 1250, 1080, 1250, 606)

    $graphics.DrawString("キャンセル", $buttonFont, $whiteBrush, 410, 1260)
    $graphics.DrawString("通常メニューへ戻る", $buttonSubFont, $whiteBrush, 390, 1345)
    $graphics.DrawString("一覧を見る", $buttonFont, $whiteBrush, 1665, 1260)
    $graphics.DrawString("会話を保ったまま確認", $buttonSubFont, $whiteBrush, 1575, 1345)

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

foreach ($menu in $menus) {
  New-RichMenuImage `
    -OutputPath (Join-Path $assetDir $menu.FileName) `
    -Header $menu.Header `
    -Accent $menu.Accent `
    -Steps $menu.Steps
}
