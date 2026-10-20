# Taskify Gate 1 — fixed India planned-date extension

Read [VALIDATION.md](VALIDATION.md): **PASS for the isolated fixed-India date schema**, with 100 emulator tests and one separate display test passing. It resolves the preceding prototype's date-order mismatch. Full product/platform feasibility and production schema acceptance are not claimed.

Travel preserves the India app timezone. The probe rejects timezone relocation and forged offsets. Other zones/DST are not supported in this experiment. See [future scope](FUTURE-TIMEZONE.md).

Sources: firestore.rules, planned-dates.mjs and tests/. Evidence: dates-final.log, display-final.log, test-inventory.md, transaction-evidence.json, travel-evidence.json and budget-evidence.json.

Run ./run.ps1 here. On another machine use Node 22/Java 21, npm ci then npm test. No Firebase login or cloud project required. Dependencies/runtimes are excluded from the evidence ZIP. The sibling original experiment and Git checkout are unchanged.
