<#
.SYNOPSIS
    Resets each test/projects/reframework-vXX to a clean slate by copying from test/templates/reframework-vXX.

.DESCRIPTION
    Overwrites project files with pristine template files, then removes ConFigTree.cs.
    Studio-generated folders (.codedworkflows, .objects, .local, etc.) are left untouched.
    After running this script, re-open each project in Studio and re-integrate ConFigTree.

.EXAMPLE
    .\Reset-Projects.ps1
    .\Reset-Projects.ps1 -Version v25.0.0
#>
param(
    [string] $Version = ""
)

$testRoot   = $PSScriptRoot
$templates  = Join-Path $testRoot "templates"
$projects   = Join-Path $testRoot "projects"

# Per-version project name — written surgically into project.json after template copy
$projectNames = @{
    "reframework-v23.10.0" = "ConFormMold_REF_v23"
    "reframework-v24.10.0" = "ConFormMold_REF_v24"
    "reframework-v25.0.0"  = "ConFormMold_REF_v25"
}

$versions = @("reframework-v23.10.0", "reframework-v24.10.0", "reframework-v25.0.0")

if ($Version -ne "") {
    $versions = $versions | Where-Object { $_ -like "*$Version*" }
    if ($versions.Count -eq 0) {
        Write-Error "No version matching '$Version' found."
        exit 1
    }
}

foreach ($v in $versions) {
    $src  = Join-Path $templates $v
    $dst  = Join-Path $projects  $v

    if (-not (Test-Path $src)) {
        Write-Warning "Template not found: $src — skipping"
        continue
    }
    if (-not (Test-Path $dst)) {
        Write-Warning "Project not found: $dst — skipping"
        continue
    }

    Write-Host "`n==> Resetting $v" -ForegroundColor Cyan

    # Files to copy from template into project (overwrite)
    $filesToCopy = @(
        "project.json",
        "Framework\InitAllSettings.xaml",
        "Tests\TestCase_InitAllSettings.xaml",
        "Data\Config_Test.xlsx"
    )

    foreach ($rel in $filesToCopy) {
        $srcFile = Join-Path $src $rel
        $dstFile = Join-Path $dst $rel

        if (-not (Test-Path $srcFile)) {
            Write-Warning "  Missing in template: $rel"
            continue
        }

        $dstDir = Split-Path $dstFile -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir | Out-Null
        }

        Copy-Item -Path $srcFile -Destination $dstFile -Force
        Write-Host "  copied  $rel"
    }

    # Surgically update "name" in project.json to the project-specific value
    $projectJson = Join-Path $dst "project.json"
    $projectName = $projectNames[$v]
    $content = Get-Content $projectJson -Raw
    $content = $content -replace '(?<="name":\s*")[^"]*(?=")', $projectName
    Set-Content $projectJson $content -NoNewline
    Write-Host "  name    => $projectName"

    # Remove ConFigTree.cs — user regenerates this from the web app
    $csFile = Join-Path $dst "ConFigTree.cs"
    if (Test-Path $csFile) {
        Remove-Item $csFile -Force
        Write-Host "  removed ConFigTree.cs" -ForegroundColor Yellow
    }

    Write-Host "  done" -ForegroundColor Green
}

Write-Host "`nReset complete. Re-open projects in Studio and paste the ConFigTree snippet." -ForegroundColor Cyan
