# Slice 5 local manual preview

Run `npm run dev:workspace` from the implementation checkout. The checked runner
starts only loopback Firestore/Auth and a Vite fixture on5177, installs production
initialization Rules locally, and seeds a validated synthetic compatibility policy.
It refuses occupied ports and leaves the cloud-backed5173 server untouched.

Open http://localhost:5177/ (redirects to the workspace SDK fixture). Select Google
or Microsoft, then use a made-up email such as `owner@example.invalid` in the
emulator form. No real provider credentials are needed. Expect Loading followed
by Workspace ready. Refresh preserves the workspace; Logout hides it. Use another
made-up account to repeat first-use setup. Data is temporary until the runner stops;
restarting clears emulator users/data. The fixture defaults explicitly to UTC;
this is not acceptance of real browser timezone capture or cloud provider flows.

To exercise timezone recovery, open the fixture with
`?sdkAuth=1&timezone=Invalid/Zone` and use a fresh synthetic account. Select a
supported timezone and continue. Existing accounts retain their committed timezone.

Manual-preview addendum follows the implementation evidence snapshot: package.json,
the probe runner and vite.config.ts changed, and tools/workspace-preview.mjs was
added. Earlier snapshot hashes/results are historical. A malformed initial local
seed (empty allowed-write schema list) was corrected to the existing contract
format; Rules still deny all deletion-fence writes. Startup now validates the seed
with the domain decoder. Root redirect/HTTP200 and both enabled sign-in buttons
were verified headlessly without creating an account; tooling lint/format passed.
No cloud changes, staging, commit or push.
