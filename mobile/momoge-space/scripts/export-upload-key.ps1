# Export encrypted upload key for Google Play (pepk.jar).
# Requires Java 11+ to run pepk.jar. Uses bundled .jdk11/ if present.
#
# Prerequisites in mobile/momoge-space/:
#   pepk.jar, encryption_public_key.pem, momoge-space-release.jks

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Find-Java11Plus {
    $bundled = Join-Path $root ".jdk11"
    $paths = @(
        (Get-ChildItem $bundled -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName "bin\java.exe" } |
            Where-Object { Test-Path $_ } | Select-Object -First 1),
        ${env:JAVA_11_HOME},
        if (${env:JAVA_HOME}) { Join-Path $env:JAVA_HOME "bin\java.exe" },
        "C:\Program Files\Android\Android Studio\jbr\bin\java.exe",
        "C:\Program Files\Eclipse Adoptium\jdk-11*\bin\java.exe",
        "C:\Program Files\Microsoft\jdk-11*\bin\java.exe"
    ) | Where-Object { $_ }

    foreach ($javaPath in $paths) {
        if ($javaPath -like "*`**") {
            $javaPath = (Get-ChildItem $javaPath -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
        }
        if (-not (Test-Path $javaPath)) { continue }
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $ver = & $javaPath -version 2>&1 | Out-String
        $ErrorActionPreference = $prevEap
        if ($ver -match 'version "(1[1-9]|[2-9][0-9])\.') { return $javaPath }
    }
    return $null
}

$java = Find-Java11Plus
if (-not $java) {
    Write-Host @"

ERROR: Java 11 or newer is required for pepk.jar.
Install JDK 11+ or run once from this folder (downloads ~180MB):

  Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/11/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" -OutFile .jdk11\temurin11.zip
  Expand-Archive .jdk11\temurin11.zip .jdk11

Then re-run: .\scripts\export-upload-key.ps1

"@ -ForegroundColor Yellow
    exit 1
}

$keytool = Join-Path (Split-Path $java) "keytool.exe"
$pepk = Join-Path $root "pepk.jar"
$encKey = Join-Path $root "encryption_public_key.pem"
$srcKeystore = Join-Path $root "momoge-space-release.jks"
$jksKeystore = Join-Path $root "momoge-j11.jks"
$outZip = Join-Path $root "encrypted_private_key.zip"

foreach ($f in @($pepk, $encKey, $srcKeystore)) {
    if (-not (Test-Path $f)) {
        Write-Error "Missing: $f`nDownload pepk.jar and encryption_public_key.pem from Play Console first."
    }
}

$storePass = $env:MOMOGE_KEYSTORE_PASSWORD
if (-not $storePass) {
    $sec = Read-Host "Keystore password (momoge-space-release.jks)" -AsSecureString
    $BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $storePass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# pepk reads legacy JKS reliably; convert PKCS12 .jks once with same Java version
if (-not (Test-Path $jksKeystore)) {
    Write-Host "Converting keystore to JKS for pepk: $jksKeystore"
    & $keytool -importkeystore `
        -srckeystore $srcKeystore -srcstoretype PKCS12 -srcstorepass $storePass `
        -destkeystore $jksKeystore -deststoretype JKS -deststorepass $storePass `
        -srcalias momogespace -destalias momogespace -destkeypass $storePass -noprompt | Out-Null
}

Write-Host "Using Java: $java"
Write-Host "Output: $outZip"

# Note: do NOT use pass: prefix — pepk mishandles it on Windows
& $java -jar $pepk `
    --keystore=$jksKeystore `
    --alias=momogespace `
    --output=$outZip `
    --keystore-pass=$storePass `
    --key-pass=$storePass `
    --rsa-aes-encryption `
    --encryption-key-path=$encKey `
    --include-cert

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$pem = Join-Path $root "upload_certificate.pem"
& $keytool -export -rfc -alias momogespace -file $pem -keystore $jksKeystore -storepass $storePass

Write-Host ""
Write-Host "Done. Upload to Play Console:" -ForegroundColor Green
Write-Host "  1) $outZip"
Write-Host "  2) $pem"
Write-Host "Do NOT upload app-release.aab in this step."
