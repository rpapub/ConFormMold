#Requires -Version 7
<#
.SYNOPSIS
    Resets each test/projects/reframework-vXX to a clean slate by copying from test/templates/reframework-vXX.

.DESCRIPTION
    Two modes:

    soft (default)
        Overwrites tracked template files with pristine copies from test/templates/.
        Studio-generated folders (.codedworkflows, .objects, .local, etc.) are left untouched.
        Use this when Studio is still open — Studio dirs are preserved.

    hard
        First restores all tracked files to HEAD (repairs deletions), then runs
        git clean -fd to wipe every untracked file and directory inside the project folder
        (Studio-generated dirs, Lib/, entry-points.json, LoadTypedConfig.xaml, …).
        Then overwrites with pristine template files.
        Use this for a full clean slate before re-opening in Studio.

    After running this script, re-open each project in Studio and re-integrate ConFigTree.

.EXAMPLE
    .\Reset-Projects.ps1
    .\Reset-Projects.ps1 -Version v25.0.0
    .\Reset-Projects.ps1 -Mode hard
    .\Reset-Projects.ps1 -Version v23 -Mode hard
#>
param(
    [string] $Version = "",
    [ValidateSet("soft", "hard")]
    [string] $Mode = "soft"
)

$testRoot   = $PSScriptRoot
$templates  = Join-Path $testRoot "templates"
$projects   = Join-Path $testRoot "projects"
$repoRoot   = Split-Path $testRoot -Parent

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
    $projectRelPath = "test/projects/$v"

    if (-not (Test-Path $src)) {
        Write-Warning "Template not found: $src — skipping"
        continue
    }
    if (-not (Test-Path $dst)) {
        New-Item -ItemType Directory -Path $dst | Out-Null
    }

    Write-Host "`n==> Resetting $v [$Mode]" -ForegroundColor Cyan

    if ($Mode -eq "hard") {
        Push-Location $repoRoot
        try {
            # Restore any deleted/modified tracked files to HEAD state
            git restore -- $projectRelPath
            Write-Host "  restored tracked files to HEAD"

            # Wipe all untracked files and directories (Studio-generated dirs, Lib/, etc.)
            git clean -fd -- $projectRelPath
            Write-Host "  cleaned untracked files/dirs" -ForegroundColor Yellow
        } finally {
            Pop-Location
        }
    }

    # Files to copy from template into project (overwrite) — both modes
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

    # Read back and verify
    $actual = (Get-Content $projectJson -Raw | ConvertFrom-Json).name
    if ($actual -ne $projectName) {
        Write-Error "  name mismatch! expected '$projectName', got '$actual'"
        exit 1
    }
    Write-Host "  name    => $actual (verified)"

    # Remove ConFigTree.cs — user regenerates this from the web app
    $csFile = Join-Path $dst "ConFigTree.cs"
    if (Test-Path $csFile) {
        Remove-Item $csFile -Force
        Write-Host "  removed ConFigTree.cs" -ForegroundColor Yellow
    }

    Write-Host "  done" -ForegroundColor Green
}

Write-Host "`nReset complete [$Mode]. Re-open projects in Studio and paste the ConFigTree snippet." -ForegroundColor Cyan

# Commit via git — only tracked files, ignore Studio-generated dirs
Write-Host "`nCommitting..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
    git add test/Reset-Projects.ps1
    foreach ($v in $versions) {
        $dst = Join-Path $projects $v
        $trackedFiles = @(
            "project.json",
            "Framework/InitAllSettings.xaml",
            "Tests/TestCase_InitAllSettings.xaml",
            "Data/Config_Test.xlsx"
        )
        foreach ($f in $trackedFiles) {
            $rel = "test/projects/$v/$f"
            if (Test-Path (Join-Path $dst $f.Replace("/", "\"))) {
                git add $rel
            } else {
                git rm --cached --ignore-unmatch $rel | Out-Null
            }
        }
    }
    git status --short
    git commit -m "test: reset projects to clean slate via Reset-Projects.ps1`n`nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push
    Write-Host "Pushed." -ForegroundColor Green
} finally {
    Pop-Location
}
