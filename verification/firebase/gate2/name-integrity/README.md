# Gate 2 name-integrity failing reproducer

**20 final tests: 16 passed, 4 failed. Gate 2 is not accepted.**

Read VALIDATION.md for actual Unicode duplicate commits, grapheme-count mismatch, native normalize() runtime failure, unexecuted Gate 2 scope and owner options. Existing name reservations enforce literal keys, not verified Unicode normalization.

Run ./run.ps1 here, or use Node 22/Java 21, npm ci and npm test elsewhere. Four acceptance failures are expected; they have not been converted to passing diagnostics. No live Firebase project or login required. No production/schema/specification changes.
