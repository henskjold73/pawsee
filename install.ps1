# Install pawsee on Windows:  irm https://raw.githubusercontent.com/henskjold73/pawsee/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

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

  $exe = Join-Path $dir 'pawsee.exe'
  if (-not (Test-Path $exe)) { throw "pawsee.exe was not found in $dir after unpacking" }

  # put the folder on PATH for new terminals (user scope) ...
  $entry = $dir.TrimEnd('\')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $entries = @(); if ($userPath) { $entries = @($userPath -split ';' | Where-Object { $_ }) }
  if (-not ($entries | Where-Object { $_.TrimEnd('\') -ieq $entry })) {
    [Environment]::SetEnvironmentVariable('Path', (($entries + $entry) -join ';'), 'User')
  }
  # ... and for this window too, so `pawsee` works straight away
  $session = @($env:Path -split ';' | Where-Object { $_ })
  if (-not ($session | Where-Object { $_.TrimEnd('\') -ieq $entry })) { $env:Path = "$env:Path;$entry" }

  Write-Host "Installed pawsee to $exe"
  if (Get-Command pawsee -ErrorAction SilentlyContinue) {
    Write-Host 'Run: pawsee   (it also works in any new terminal)'
  } else {
    Write-Host "Run: & '$exe'"
  }
} finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
