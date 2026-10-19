# FreeVideoGenerator MCP

[简体中文](README.zh-CN.md) · [Client setup](docs/clients.md) · [17 tools](docs/tools.md) · [Troubleshooting](docs/troubleshooting.md) · [Registry publishing](docs/publishing.md)

Create AI images and videos from your AI client using your [FreeVideoGenerator](https://freevideogenerator.app) account. Discover current models and Quick Apps, quote credit costs, upload references, submit single or batch tasks, and retrieve results.

This repository contains public connection examples, a dependency-free helper, an optional agent Skill, and the official MCP Registry descriptor. The server runs at FreeVideoGenerator; website, authentication, billing, storage and generation providers remain in the existing service. The helper prints configuration and installs the Skill locally.

## Connect

Remote **Streamable HTTP** endpoint:

```text
https://freevideogenerator.app/api/mcp
```

Sign in with your FreeVideoGenerator account in the client's browser OAuth flow and review the requested scopes. Generation uses that account's credits. Discovery and quotes do not submit paid jobs. No provider key or database credentials are required.

**Claude Code**

```sh
claude mcp add --transport http --scope user freevideogenerator https://freevideogenerator.app/api/mcp
```

Open `/mcp` and authorize the connection.

**Codex**

```sh
codex mcp add freevideogenerator --url https://freevideogenerator.app/api/mcp
codex mcp login freevideogenerator
```

For Cursor, Gemini CLI, Kimi Code, ZCode, ChatGPT and developer API keys, see [client setup](docs/clients.md). Connect the remote URL directly; this helper does not implement a local stdio MCP server.

## Optional Skill and helper

Requires Git and Node.js 20+. There are no npm dependencies or installation hooks.

```sh
git clone https://github.com/horace68/freevideogenerator-mcp.git
cd freevideogenerator-mcp
node bin/freevideogenerator.mjs config codex
node bin/freevideogenerator.mjs install-skill codex
node bin/freevideogenerator.mjs doctor
```

`config` prints a snippet to merge into existing settings. Available clients: `codex`, `claude`, `cursor`, `gemini`, `kimi`, `zcode`. It never changes client settings or logs you in.

`install-skill codex` copies `skills/freevideogenerator` to `~/.agents/skills/freevideogenerator`; `install-skill claude` uses `~/.claude/skills/freevideogenerator`. Existing destinations are never overwritten. Once discovered by your agent, invoke `$freevideogenerator` in Codex or `/freevideogenerator` in Claude Code. Restart the agent if it has not picked up the Skill. MCP connection and authorization are separate.

Choose a parent skills directory for a project or another compatible client:

```sh
node bin/freevideogenerator.mjs install-skill custom --dir /path/to/project/.agents/skills --dry-run
node bin/freevideogenerator.mjs install-skill custom --dir /path/to/project/.agents/skills
```

To update, compare any customized Skill with this repository, move the installed directory aside and reinstall. To uninstall, remove only the installed `freevideogenerator` directory. Revoking service access is a separate action.

`doctor` checks public resource metadata, authorization metadata/PKCE and the unauthenticated MCP challenge. It sends no credentials, creates no jobs and spends no credits. A passing result does not prove authenticated generation or compatibility with every client. This helper package is private and is not published to npm; use the Git repository.

## Try a task

> Discover available image and video models and check my credits. Quote a five-second product video using my selected library image. If the cost is within 100 credits, generate it, track the task and give me the result and task link. Keep the same request ID when retrying.

For a local file, request an upload with `create_upload`, upload the `file` multipart field or use the returned browser upload page, then read `get_upload` for its file ID. A chat attachment or local path is not automatically available to the service. [Tools and workflow](docs/tools.md) covers quotes, batches, uploads and recovery.

The service supports image/video generation, configured Quick Apps and shot suggestions. Supported models, modes and prices are discovered at runtime. Audio files can be references where supported; no audio-only generation, automatic timeline editing, assembly, payment or publishing tools are advertised.

## Access and verification

OAuth authorization is account-wide for the granted scopes. Review connections at [Settings → Connections](https://freevideogenerator.app/settings/connections) and developer keys at [Settings → API keys](https://freevideogenerator.app/settings/apikeys). Revocation blocks future access and media capabilities; accepted jobs continue. Result links expire after ten minutes and can be renewed through MCP. [Security and data scope](SECURITY.md).

The service's October 19, 2026 release acceptance recorded OAuth/PKCE and refresh, all 17 tools, API keys, real image/video completion, batch retry billing, uploads/imports and ranged downloads. This repository's public checks verify discovery and the authentication challenge separately; individual client OAuth and generation journeys remain unverified here. See [verification status](docs/clients.md#verification-status).

[server.json](server.json) describes `io.github.horace68/freevideogenerator` version `1.0.1`, published to the [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.horace68%2Ffreevideogenerator/versions/1.0.1) on October 19, 2026. Public readback confirmed active/latest status and matching endpoint metadata. Registry metadata points to the hosted service; it does not publish the helper to npm or install the Skill. [Publishing and evidence](docs/publishing.md).

## Development

```sh
npm run check
npm test
npm pack --dry-run
```

Tests cover client formats, isolated Skill installation, overwrite/symlink protection, CLI failures, public diagnostics and Registry metadata. CI targets Linux, macOS and Windows with Node.js 20, 22 and 24; authenticated or paid hosted operations are excluded from CI.

MIT covers this repository's helper, examples and Skill. It does not grant service credits, backend rights or rights to user media. The helper retains the upstream MIT copyright notice.
