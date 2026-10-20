# Exact final test results


- ok 1: categories: owner creates entity and unique name guard atomically
- ok 2: categories: missing entity or missing name guard rejects and rolls back
- ok 3: categories: identical and case-only duplicate names rejected
- ok 4: categories: archived names remain reserved
- ok 5: categories: spoofed owner, arbitrary key, mismatched guard and foreign actor rejected
- ok 6: categories: exact-key concurrent claims yield one entity and guard
- ok 7: categories: ASCII length 30 accepted; 31 rejected
- not ok 8: categories: required NFC-equivalent duplicate must be rejected
- not ok 9: categories: required valid 10-grapheme emoji name must be accepted
- ok 10: locations: owner creates entity and unique name guard atomically
- ok 11: locations: missing entity or missing name guard rejects and rolls back
- ok 12: locations: identical and case-only duplicate names rejected
- ok 13: locations: archived names remain reserved
- ok 14: locations: spoofed owner, arbitrary key, mismatched guard and foreign actor rejected
- ok 15: locations: exact-key concurrent claims yield one entity and guard
- ok 16: locations: ASCII length 30 accepted; 31 rejected
- not ok 17: locations: required NFC-equivalent duplicate must be rejected
- not ok 18: locations: required valid 10-grapheme emoji name must be accepted
- ok 19: ownership protects entity and guard reads; name guard cannot be independently edited or deleted
- ok 20: Unicode normalize capability: deployed expression fails on an otherwise valid write
