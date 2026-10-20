# Client setup

Endpoint: `https://freevideogenerator.app/api/mcp` · Transport: **Streamable HTTP** · Default authentication: **browser OAuth with PKCE S256**.

Merge examples into existing settings. The helper does not edit client configuration, manage tokens or act as a stdio server. Use your own FreeVideoGenerator account and review the requested scopes; authorized generation spends its existing credits.

## Claude Code

```sh
claude mcp add --transport http --scope user freevideogenerator https://freevideogenerator.app/api/mcp
```

Open `/mcp` and authorize. For project scope, merge [claude.mcp.json](../examples/claude.mcp.json) into `.mcp.json` instead. Avoid duplicate registrations unless you intend a scope override. [Official MCP documentation](https://code.claude.com/docs/en/mcp).

Optional Skill: `node bin/freevideogenerator.mjs install-skill claude`, then `/freevideogenerator` once discovered.

## Codex

```sh
codex mcp add freevideogenerator --url https://freevideogenerator.app/api/mcp
codex mcp login freevideogenerator
```

Or merge [codex.toml](../examples/codex.toml) into `~/.codex/config.toml` (or your configured Codex location). [Official OpenAI MCP documentation](https://developers.openai.com/codex/mcp/).

Optional Skill: `node bin/freevideogenerator.mjs install-skill codex`. It uses `~/.agents/skills`; a custom `CODEX_HOME` does not change this helper's destination. Specify `--dir` when needed. Invoke `$freevideogenerator`; restart if discovery has not refreshed. [Official OpenAI skill documentation](https://developers.openai.com/codex/skills/).

For a developer key, Codex can read an environment variable without saving its value in configuration:

```sh
codex mcp add freevideogenerator --url https://freevideogenerator.app/api/mcp --bearer-token-env-var FREEVIDEOGENERATOR_MCP_API_KEY
```

Set that variable through your own secure environment/secret manager. Choose either this developer-key configuration or OAuth for the same server entry.

## Cursor

Merge [cursor.mcp.json](../examples/cursor.mcp.json) into `~/.cursor/mcp.json` or your project's `.cursor/mcp.json`. Open MCP settings and complete the offered OAuth sign-in. [Official documentation](https://cursor.com/docs/mcp).

## Gemini CLI

```sh
gemini mcp add --transport http --scope user freevideogenerator https://freevideogenerator.app/api/mcp
```

Run `/mcp auth freevideogenerator` inside Gemini CLI. Or merge [gemini.settings.json](../examples/gemini.settings.json) into `~/.gemini/settings.json`; the example uses `httpUrl` and enables OAuth discovery. [Official documentation](https://geminicli.com/docs/tools/mcp-server/).

## Kimi Code

Use `/mcp-config` to add an HTTP server, then `/mcp-config login freevideogenerator`. Or merge [kimi.mcp.json](../examples/kimi.mcp.json) into `~/.kimi-code/mcp.json` (or `$KIMI_CODE_HOME/mcp.json`). Start a new session after adding the server. Older `kimi-cli` builds have different commands and paths; use the instructions shipped with your version. [Official documentation](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html).

## ZCode

In Settings → MCP Servers, add an HTTP server with the endpoint and enable OAuth. Click **Open authorization** on its row and finish sign-in in your browser. Or merge [zcode.config.json](../examples/zcode.config.json) into `~/.zcode/cli/config.json` under `mcp.servers`; verify OAuth is enabled in the UI. [Official documentation](https://zcode.z.ai/en/docs/mcp-services).

The helper supports a ZCode Skill destination at `~/.agents/skills` via `install-skill zcode`. Skill discovery depends on the host/version; use `custom --dir` for another supported location.

## ChatGPT

Use the custom remote MCP connection entry available in your account/workspace, enter the endpoint, and choose OAuth. Availability and UI labels depend on account and administrator settings. Use the client's registration/callback flow; do not invent a client ID or copy website cookies. [Official OpenAI remote MCP guidance](https://developers.openai.com/api/docs/guides/custom-mcp-server).

Local Skill installation does not install a ChatGPT plugin. MCP Registry publication is separate from ChatGPT or Claude directory approval.

## Developer keys and other clients

Create a developer key with the **MCP** permission preset at [Settings → API keys](https://freevideogenerator.app/settings/apikeys). Use `Authorization: Bearer <key>` or `X-Api-Key` in the client's secure header configuration. Keep secrets out of shared files, shell history and URLs. Existing keys retain their original scopes/rate limits; MCP keys default to 120 requests per minute, with account limits also enforced.

Clients need native Streamable HTTP plus OAuth, or a way to provide a developer key securely. Local stdio support alone is insufficient. Browser access, filesystem uploads, media preview and Skill discovery are additional client capabilities.

## Verification status

Instructions were checked against current official documentation on October 19, 2026. Local Codex command syntax was checked. The hosted service's release acceptance recorded protocol-level OAuth/PKCE/refresh, API keys, 17 tools, real image/video completion, upload/import, ranged downloads, batch idempotency and revocation. This is service acceptance evidence; it does not certify each named client.

| Client | Configuration supplied | Individual OAuth → generation → download |
| --- | --- | --- |
| Claude Code | HTTP JSON + CLI | Pending |
| Codex | HTTP TOML + CLI; optional key environment variable | Pending |
| Cursor | HTTP JSON | Pending |
| Gemini CLI | `httpUrl` + OAuth JSON/CLI | Pending |
| Kimi Code | HTTP JSON + current TUI flow | Pending |
| ZCode | Native HTTP JSON + settings flow | Pending |
| ChatGPT | Personal custom MCP with CIMD; public-review draft with DCR | Partial: OAuth, account/models/quote, image lookup, batch lookup and media import passed; native creation replay blocked by a security check, one video-detail call failed |

The October 20 ChatGPT walkthrough uses a dedicated synthetic account. Independent
MCP SDK generation completed one image and two videos for 140 credits; identical
request retries added no charge. This does not establish a fully passing native
ChatGPT generation journey. The public draft's DCR authorization and 17-tool scan
passed separately. See [review evidence](openai-review.md).

The repository's `doctor` checks public discovery/PKCE and the HTTP 401 challenge without credentials. It does not run OAuth, read account data or generate media. Record client version, date, operating system, authentication mode, tool discovery, uploads, billing and downloads when completing a client acceptance test.
