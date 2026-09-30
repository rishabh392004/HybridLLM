$src = "c:\Users\risha\OneDrive\Desktop\LLM_Hybrid"
$zipRoot = "c:\Users\risha\OneDrive\Desktop\LLM_Hybrid\ForeCombine-Operational-Platform.zip"
$zipPublic = "c:\Users\risha\OneDrive\Desktop\LLM_Hybrid\frontend\public\ForeCombine-Operational-Platform.zip"

if (Test-Path $zipRoot) { Remove-Item -Force $zipRoot }
if (Test-Path $zipPublic) { Remove-Item -Force $zipPublic }

$tempDir = Join-Path $env:TEMP ("ForeCombine_Pkg_" + [System.Guid]::NewGuid().ToString().Substring(0,8))
$dest = Join-Path $tempDir "ForeCombine-Weather-Blending"
New-Item -ItemType Directory -Path $dest -Force | Out-Null

$exclude = @("node_modules", "dist", ".git", "__pycache__", ".pytest_cache", ".venv", "venv", "screenshots")

Get-ChildItem -Path $src | ForEach-Object {
    if ($_.Name -notin $exclude -and $_.Name -notlike "*.zip" -and $_.Name -notlike "*.log" -and $_.Name -notlike "make_zip.ps1") {
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    }
}

Get-ChildItem -Path $dest -Recurse -Directory | Where-Object { $_.Name -in $exclude } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $dest -Recurse -Include "*.pyc" | Remove-Item -Force -ErrorAction SilentlyContinue

Compress-Archive -Path "$dest\*" -DestinationPath $zipRoot -Force
Copy-Item -Path $zipRoot -Destination $zipPublic -Force
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

$item = Get-Item $zipRoot
$sizeMB = [math]::Round(($item.Length / 1MB), 2)
Write-Output "ZIP_CREATED_SUCCESS: Size is $sizeMB MB at $zipRoot and $zipPublic"
