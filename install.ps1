# Install pawsee on Windows:  irm https://raw.githubusercontent.com/henskjold73/pawsee/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repo = 'henskjold73/pawsee'
$base = if ($env:PAWSEE_BASE_URL) { $env:PAWSEE_BASE_URL } else { "https://github.com/$repo/releases/latest/download" }
$dir  = if ($env:PAWSEE_INSTALL_DIR) { $env:PAWSEE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'pawsee' }
$file = 'pawsee-windows-x64.zip'
$tmp  = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
  Write-Host "Downloading $file ..."
  Invoke-WebRequest "$base/$file" -OutFile (Join-Path $tmp $file)
  Invoke-WebRequest "$base/SHA256SUMS.txt" -OutFile (Join-Path $tmp 'SHA256SUMS.txt')

  $want = (Get-Content (Join-Path $tmp 'SHA256SUMS.txt') | Where-Object { $_ -match [regex]::Escape($file) + '$' } | Select-Object -First 1) -split '\s+' | Select-Object -First 1
  $got  = (Get-FileHash (Join-Path $tmp $file) -Algorithm SHA256).Hash.ToLower()
  if (-not $want -or $want.ToLower() -ne $got) { throw 'checksum mismatch - not installing' }

  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  Expand-Archive (Join-Path $tmp $file) -DestinationPath $dir -Force

  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  if (($userPath -split ';') -notcontains $dir) {
    [Environment]::SetEnvironmentVariable('Path', "$userPath;$dir", 'User')
    Write-Host "Added $dir to your PATH (open a new terminal to use it)."
  }
  Write-Host "Installed pawsee to $dir\pawsee.exe"
  Write-Host 'Run: pawsee'
} finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
