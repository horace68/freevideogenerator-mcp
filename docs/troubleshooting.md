# Troubleshooting

| Symptom | Recovery |
| --- | --- |
| No tools after installing the Skill | Register the remote HTTP endpoint and finish OAuth separately. A Skill supplies a workflow, not a server connection. |
| Helper exits when launched as MCP | Remove that stdio entry. Connect to `https://freevideogenerator.app/api/mcp` with Streamable HTTP. |
| `doctor` fails / HTTP 404 or 503 | Check the endpoint and service availability. A missing metadata route or disabled service needs a hosted-service fix; reinstalling the Skill does not enable it. |
| `doctor` passes but tools fail | Public diagnostics do not sign in. Inspect the client's OAuth/key state, granted scopes and sanitized tool error. |
| HTTP 401 | Sign in again or verify the developer key is active and has MCP permission. Never replace OAuth with a website cookie. |
| HTTP 403 / `INSUFFICIENT_SCOPE` | Reauthorize the scopes in the challenge or update the key's permissions. References also require `media:read`; native clients without an Origin and browser-origin policy are separate checks. |
| OAuth callback rejected | Use the client's discovered registration flow. Keep the exact registered redirect URI, including host/path, through authorization and exchange. Do not rewrite `127.0.0.1` to `localhost`, invent credentials or weaken redirect checks. |
| HTTP 429 / `RATE_LIMITED` | Honor `Retry-After` and reduce polling. Use `get_batch` for children and wait at least ten seconds per active job. MCP keys default to 120 requests/minute; older keys can have lower limits. |
| Unknown model/scene or invalid parameters | Re-read capabilities, models and the exact generation schema. Check mode-specific references, duration and aspect ratio before quoting again. |
| `PRICE_CHANGED` / insufficient credits | Read account balance and re-quote the unaccepted request. Proceed only within the authorized budget; no tool buys credits. |
| Creation timed out | Preserve the complete original UUIDs, credits and inputs. Read known job/batch IDs or retry the exact request; new IDs can charge again. |
| Partial batch failure | Read ordered children, charge/refund state and individual jobs. Keep successful tasks; a deliberate rerun of failed work is a new quoted task. |
| No media or file not found | Confirm the connected account owns the file. Paginate with the returned cursor. Chat attachments/local paths are not service file IDs. |
| Upload rejected | Use the issued multipart URL and `file` field, a supported MIME/signature, and at most 10 MiB. Browser upload must use the same account. Do not manually set a multipart boundary. |
| Import rejected | Use a public HTTPS media URL without credentials, private addresses, custom ports or redirects; download authorized local bytes and upload them if needed. |
| HTTP 410 / `CAPABILITY_EXPIRED` | Renew downloads with `get_media_url` or `get_job`. For an expired unfinished upload, request a new capability. Recheck the grant/key if access was revoked. |
| Skill destination exists | Compare and preserve custom changes, move the directory aside, and reinstall. There is no destructive force-overwrite option. |

For a client lacking file/browser/media inspection tools, use the returned upload page or website. Report visual/download verification as pending until actually performed.

For public issues include client/version, operating system, tool name, sanitized error code and reproducible steps. Exclude credentials, callback queries, capability URLs, private prompts and private media. [Security reporting](../SECURITY.md).
