# Verify a .jks matches Play Console upload key (SHA-1 23:5A:07:...)
param(
    [string]$KeystorePath = (Join-Path $PSScriptRoot "..\momoge-space-release.jks"),
    [string]$ExpectedSha1 = "23:5A:07:4D:97:99:43:14:5C:13:12:CA:D6:89:8A:D9:04:11:DB:27",
    [string]$StorePass = "",
    [string]$Alias = "momogespace"
)

$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
if (-not (Test-Path $keytool)) {
    Write-Error "keytool not found. Install Android Studio or set JAVA_HOME."
    exit 1
}
if (-not (Test-Path $KeystorePath)) {
    Write-Error "Keystore not found: $KeystorePath"
    exit 1
}
if (-not $StorePass) {
    $StorePass = Read-Host "Keystore password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($StorePass)
    $StorePass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$out = & $keytool -list -v -keystore $KeystorePath -alias $Alias -storepass $StorePass 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Error $out
    exit 1
}
if ($out -notmatch "SHA1:\s*([0-9A-F:]+)") {
    Write-Error "Could not read SHA-1 from keystore."
    exit 1
}
$sha1 = $matches[1].ToUpper()
$expected = $ExpectedSha1.ToUpper()
Write-Host "Keystore: $KeystorePath"
Write-Host "SHA-1:    $sha1"
if ($sha1 -eq $expected) {
    Write-Host "OK — matches Play upload key. Use this file in android/keystore.properties"
    exit 0
}
Write-Host "NO — Play expects: $expected"
exit 2
