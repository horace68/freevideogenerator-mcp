# OpenAI plugin review evidence

The exact current portal state is recorded in
[the submission receipt](submissions/review-draft.json). Registry publication,
uploading an OpenAI draft, submitting it, approval and public publication are
separate events. The official MCP Registry entry remains version `1.0.1`; the
OpenAI plugin package is `0.1.1`.

## Package and automated checks

Build the allowlisted ZIP with `python3 scripts/build-plugin.py`. The default
Codex-compatible format contains `.codex-plugin/plugin.json`, `.mcp.json`, the
MIT license, original icon and bundled Skill. The canonical source remains
`plugin.json` and `mcp.json`; `--format portable` emits that format separately.
No private account details, OAuth tokens, API keys, domain token, cookies or
local review records enter the ZIP.

The portal accepted version `0.1.1` on October 20, 2026. Developer identity and
the apex domain are verified, DCR OAuth is authorized, Skill checks passed and
the latest 17-tool MCP scan reported no findings. The Creativity category was
accepted. Remaining non-blocking metadata findings concern the actual brand
name and an incomplete automated privacy-policy assessment. Neither is an
approval or a promise of acceptance.

## Actual acceptance scope

- A dedicated verified, non-admin account contains synthetic review data only.
  It was provisioned with 500 test credits; the balance after these checks was 360.
  This describes the recorded acceptance fixture. The current private reviewer
  credentials are managed separately by the owner and are excluded from evidence.
- MCP SDK calls quoted exact image/video inputs, completed one `nano-banana-2`
  image for 80 credits and two five-second `seedance-1.0-pro-fast` videos for
  30 credits each. Downloaded files were visually inspected and decoded.
- Exact original UUID/input retries returned the same jobs and added zero
  credits. An owned public logo was imported and downloaded successfully;
  foreign media lookup returned `MEDIA_NOT_FOUND`.
- The private ChatGPT CIMD connection successfully read account/models/schema,
  quoted the image, retrieved the completed image and batch, and imported and
  resolved owned reference media. Three negative cases refused purchases/card
  storage, other-user access and deletion.
- The native ChatGPT creation replay was blocked by a security check before
  reaching the MCP audit. One video `get_job` call recorded `REQUEST_FAILED`;
  the batch read and original SDK result downloads succeeded. A fully passing
  native ChatGPT creation-to-download journey is not established.

The [129.57-second walkthrough](https://asset.freevideogenerator.app/mcp/review-2026-10-20-v1/walkthrough.mp4)
shows actual captured browser frames and original generated outputs, with
waiting periods shortened and the limitations retained. Creation completed
through MCP before the ChatGPT recording. The video contains no credentials or
raw media capability URLs. Its publication receipt records HTTP 200, `video/mp4`,
matching 5,007,161 bytes/SHA-256, and HTTP 206 with CORS for OpenAI origins.

## Saved review information

On October 21, the owner entered the private demo login. Its username and password
were preserved. Tenant and sign-in/OAuth instructions were completed, saved through
**Save details**, then reopened to verify persistence. The instructions use the
connected account's actual balance and owned IDs without assuming that it is the
same account shown in the earlier recording.

Each of the five positive and three negative cases was checked in the portal and
matched the package; all case tabs were marked complete. The walkthrough URL and
release notes also matched. These fields are read-only in the dashboard because
they are managed by the ZIP. The incomplete-review-information finding is gone.
[Public verification record](submissions/review-details-2026-10-21.json).

The draft remains **Not submitted**. The final six policy attestations have not
been accepted; they require the owner's explicit confirmation. The review form
contains the private access details, which are not copied into this repository.

## Domain challenge deployment

`cloudflare/openai-verification/` serves only the exact hostname/path
`https://freevideogenerator.app/.well-known/openai-apps-challenge` on GET/HEAD.
Other requests return 404/405; an absent binding returns 503. It is a separate
Worker with a narrow route. The application Worker was not redeployed from its
unrelated dirty checkout.

Using an authenticated Wrangler CLI for the configured account:

```sh
wrangler types --config cloudflare/openai-verification/wrangler.jsonc
wrangler deploy --dry-run --config cloudflare/openai-verification/wrangler.jsonc
wrangler deploy --config cloudflare/openai-verification/wrangler.jsonc
wrangler secret put OPENAI_APPS_CHALLENGE --config cloudflare/openai-verification/wrangler.jsonc
```

Enter the portal's challenge through the secret command's standard input.
Keep it outside Git and verify the exact public plaintext response before using
the portal's domain verification. The deployed verification Worker version is
`e59cfd48-d496-420e-9a6c-c703e16cc597`, at 100% traffic when checked.

Local syntax checks and all 19 Node tests passed. The verification Worker also
passed generated-runtime-type checking and Wrangler dry-run validation. These
checks do not imply public directory approval.

Follow the [official submission workflow](https://developers.openai.com/plugins/deploy/submission).
Reviewer credentials stay separate from the public package. The final submission
includes policy attestations and acceptance of
[OpenAI's App Developer Terms](https://openai.com/policies/developer-apps-terms/).
