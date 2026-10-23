# Slice3 — Configuration checkpoint

This records step1. The subsequent [Auth/session checkpoint](03-provider-sign-in-session.md)
now integrates the stable app factory; prospective integration wording below
describes the configuration checkpoint, not the current code.

23 October2026. **Firebase/client configuration implemented; Google/Microsoft callback
entries visually verified from owner screenshots.** This is step1 only. Authentication
controller, provider flows, persistence/Logout and real OAuth validation are not
implemented by this checkpoint. See [accepted Slice3 detailing](03-provider-sign-in.md).

## Applied configuration

| Item | Result |
|---|---|
| Project | taskify-dev-dpdhole /243252492098; ACTIVE; billing disabled |
| Web App | Taskify PoC browser; appId `1:243252492098:web:39b2429e66b2e1f511fadb` |
| Providers | Existing Google/Microsoft settings unchanged; Apple stays outside Slice3 scope |
| Microsoft audience | Personal and work/school accounts; Entra setting visually verified from owner screenshot |
| Authorized domains | Added exact existing dev/qc/uat hosts; preserved localhost and canonical Hosting domains |
| Local settings | Public SDK values in ignored `.env.auth.local`; no provider secrets/operator tokens |
| Shared app preparation | Stable `taskify-browser` factory and strict configuration/host decoder; integration is step2 |
| Same-artifact promotion | Known hosted origins select their own authDomain at runtime; localhost uses canonical Firebase authDomain |
| CSP preparation | Allows Identity Toolkit, Secure Token, Firestore, Google's Auth helper loader and trusted helper frames; no wildcard/unsafe-inline |
| Windows formatting | Added explicit LF rule for HTML and normalized local HTML line endings |

[Configuration evidence](03-provider-sign-in-configuration-evidence.json) records
sanitized metadata, validated inputs and log hashes. Provider secret/key values
are excluded. The existing intentional browser API key is retained. The public
Auth SDK project-configuration endpoint returned200 with the configured key and
all six authorized domains; this is not a successful sign-in.

The browser factory is deliberately not wired into the current ordinary app yet.
The existing Slice2 read adapter remains an isolated reader until step2 composes
the stable app, Auth and Firestore with one lifecycle owner. No authentication
observer or provider interaction starts in this step. The runtime host allowlist
rejects arbitrary hosts; use `localhost`, not `127.0.0.1`, for real local OAuth.

## Verify provider registrations — owner action

Firebase authorized domains and provider callback registration are separate.
The Firebase settings are complete. Existing operator access does not expose provider registration consoles. The
owner supplied screenshots confirming the Google origins/redirect URIs and
Microsoft Web redirect URIs. Verification steps below remain operational guidance.

Owner-reported current settings: Google JavaScript origins are http://localhost,
http://localhost:5000 and https://taskify-dev-dpdhole.firebaseapp.com. Google currently lists only the canonical Firebase /__/auth/handler URI.
Microsoft initially listed only that URI; the owner subsequently supplied a
screenshot confirming all four canonical/dev/qc/uat callbacks under the Web
platform. Microsoft callback registration is visually verified. The owner subsequently supplied a Google screenshot confirming those origins,
localhost:5173 and all four redirect URIs. Both callback lists match. For Google's
origin allowlist, also add the three exact preview origins and
http://localhost:5173 for the configured local Vite port; preserve existing entries.
Current entries are visually verified from owner screenshots; initial values
above describe the preceding owner-reported state.

Use these exact **Authorized redirect URIs / Web redirect URIs** in both clients:

~~~text
https://taskify-dev-dpdhole.firebaseapp.com/__/auth/handler
https://taskify-dev-dpdhole--dev-por3atkf.web.app/__/auth/handler
https://taskify-dev-dpdhole--qc-xnxat620.web.app/__/auth/handler
https://taskify-dev-dpdhole--uat-hzsuai7v.web.app/__/auth/handler
~~~

### Google

1. Open the Google Cloud project taskify-dev-dpdhole.
2. Go to Google Auth Platform → Clients (or APIs & Services → Credentials).
3. Open the Web OAuth client whose client ID matches Firebase Authentication's
   Google provider. Do not modify an unrelated client or create a second one.
4. Under Authorized redirect URIs, compare the four exact URLs above. Preserve
   other intentional entries; add missing entries and save.
5. Check Audience/testing restrictions and intended test-user access for review.
   Do not switch to production or broaden the audience as part of this check.

[Google redirect URI requirements](https://developers.google.com/identity/protocols/oauth2/web-server)
and [Firebase same-origin redirect guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices).
Firebase handles OAuth; this slice does not add a separate Taskify OAuth backend.

### Microsoft

1. Open Microsoft Entra admin center → Entra ID → App registrations → All applications.
2. Open the app whose Application (client) ID matches Firebase's Microsoft provider.
3. Go to Authentication → platform configuration. Use **Web**, since Firebase
   performs the authorization-code exchange; do not replace it with a SPA callback.
4. Compare/add the four Web redirect URIs above and save. Existing intentional
   callback entries remain. Exact URLs matter; no wildcard redirect URIs.
5. Verify supported account types are **Accounts in any organizational directory
   and personal Microsoft accounts**. The manifest equivalent is
   `signInAudience: AzureADandPersonalMicrosoftAccount`. Merely selecting the
   `common` endpoint cannot broaden a single-tenant app registration.
6. In Certificates & secrets, verify that the secret configured in Firebase has
   not expired. Do not paste its value into chat, source, evidence or Vite settings.

[Microsoft callback steps](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri)
and [supported audience/URI rules](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url).
Real callback completion and personal/organizational access remain acceptance tests.

No live callback is added beyond existing canonical configuration. Before a
future live promotion, explicitly configure/validate its same-origin handler.
If an expired preview is recreated with a changed hostname, update the allowlist,
Firebase domains and provider callbacks before using it for sign-in.

## Local checks and commands

~~~powershell
node tools/check-auth-config.mjs
npm run verify
~~~

The first command reads auth-mode local settings and prints only nonsecret
identity/host metadata. Ordinary test/build mode does not load `.env.auth.local`.
To intentionally select these public values later, use Vite `--mode auth`.
The configuration file is not committed; another machine needs its own copy from
the registered Web App settings. `.env.example` documents variable names.

Passed: types,20-file boundary/cycle checks, lint, scoped formatting,65 unit/
component tests, three builds/module isolation, offline client-config validation,
and local Hosting validation at390/1280px with real Firestore readiness under
the revised CSP. A dirty/local-only artifact was used and is non-publishable.
Actual Auth iframe, provider-popup/redirect behavior, cookies/storage restrictions,
refresh tokens, cross-tab sessions and provider credentials are not validated by
these checks. Those tests follow implementation; no interactive OAuth test ran.

The pre-step fresh-checkout check initially failed on CRLF HTML formatting; the
explicit HTML attribute resolves it. Existing bundle-size warnings remain.
No dependency pins changed. No emulator integration suite was rerun for this
configuration-only step; the revised Hosting policy was tested independently.

## Screenshot verification

The Google screenshot confirms canonical/dev/qc/uat redirect URIs plus the
canonical/preview origins and localhost:5173. The owner reported completion.
Google test-user/audience restrictions and actual OAuth completion remain untested.

### Microsoft

The owner supplied an Entra Authentication (Preview) screenshot showing the
canonical Firebase callback plus the exact dev/qc/uat handlers, all as Web
redirect URIs. These entries match the required URLs. A subsequent Supported accounts screenshot confirms **Any Entra ID Tenant +
Personal Microsoft accounts**, matching the agreed personal/work-school scope.
Microsoft secret expiry remains unverified. This verifies registration, not OAuth completion.

## Next step

Step2 adds the authentication port/controller, stable app/Firestore composition,
state projection and restoration/gate orchestration. The required callback lists
are now visually verified. Microsoft secret expiry, Google audience
restrictions and actual provider completion remain subsequent acceptance checks.
Interactive validation still requires separate permission. Proof-based linking is Slice4; provisioning is Slice5.

No hosting/deployment, commit or push occurred. Every future hosting request must
name dev, qc, uat or live under the [channel policy](../hosting_channels.md).
