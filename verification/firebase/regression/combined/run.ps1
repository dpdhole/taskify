$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:CI = 'true'
$env:FIREBASE_CLI_DISABLE_UPDATE_CHECK = 'true'
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-taskify-regression --only firestore,auth,hosting 'node --test --test-concurrency=1 tests/*.test.mjs'
exit $LASTEXITCODE
