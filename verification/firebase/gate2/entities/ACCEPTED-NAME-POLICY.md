# Accepted PoC/beta name-policy limitation

The project owner accepted the proposed option in this chat: preserve Unicode names, enforce NFC normalization and the 30-grapheme limit in the supported client, and retain Rules-enforced ownership/data shape/literal-key reservations. This acceptance overrides the stronger adversarial assumption for the local PoC/beta feasibility work. It is not permission to modify authoritative repository specifications or deploy.

The supported adapter (names.mjs) normalizes to NFC, trims, counts grapheme clusters with Intl.Segmenter, requires 1–30 clusters, lowercases the resulting key, and computes a SHA-256 reservation ID. Rules verify trim/lower relationship and the hash of the supplied literal key. Names containing slash/percent/Unicode do not become raw Firestore path segments.

A modified owner client can bypass NFC/grapheme checks in its own namespace. Different canonically equivalent literal names can therefore occupy different reservations. Rules do not claim to validate Unicode normalization, grapheme count, or full Unicode case folding. Firestore storage limits still apply. Ownership isolation and all Task/event integrity checks remain server-enforced.

The final suite includes a successful crafted-owner bypass as an explicit demonstration of this accepted limitation. That passing diagnostic is not evidence of strong server-side Unicode enforcement. The earlier failing name-integrity reproducer remains unchanged in ../name-integrity.
