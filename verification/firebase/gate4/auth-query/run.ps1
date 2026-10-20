$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:CI = 'true'
$env:FIREBASE_CLI_DISABLE_UPDATE_CHECK = 'true'
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-taskify-gate4 --only firestore,auth,hosting 'node --test tests/*.test.mjs'
exit $LASTEXITCODE
