# Tools and workflow

The authenticated server's tool schemas and capability responses are authoritative. Client prefixes may change visible names. This reference follows the hosted service version `1.0.1` with 17 tools; model availability and prices are discovered at runtime.

## Tool reference

| Tool | Purpose | Required scope |
| --- | --- | --- |
| `get_capabilities` | Workflows, modes, supported scopes, uploads and batch limit | Authenticated |
| `list_models` | Current image/video models; filter by `kind` or `operation` | Authenticated |
| `get_generation_schema` | Exact model/scenario inputs and constraints | Authenticated |
| `get_account` | Credits and creator-assist quota | `account:read` |
| `quote_generation` | Validate/quote 1–12 drafts without submitting paid work | `generations:read` |
| `create_generation` | Submit one quoted image/video or Quick App stage | `generations:write` |
| `create_batch` | Submit 1–12 quoted tasks with distinct child UUIDs | `generations:write` |
| `get_job` | Owned status, result, charge/refund and task link | `generations:read` |
| `get_batch` | Ordered children, dispatch state and partial failures | `generations:read` |
| `list_jobs` | Page through owned history, including website tasks | `generations:read` |
| `list_media` | Page through owned reference media | `media:read` |
| `get_media_url` | Renew a private media preview/download capability | `media:read` |
| `create_upload` | Create multipart upload capability and browser page | `media:write` |
| `get_upload` | Resolve this connection's upload to an owned file ID | `media:write` |
| `import_media` | Import public HTTPS media with a stable request UUID | `media:write` |
| `create_creator_assist` | Create three editable shot suggestions within daily quota | `generations:write` |
| `get_creator_assist` | Read a shot-suggestion request by `requestId` | `generations:read` |

Reference-based quoting/creation also needs `media:read`. Shot suggestions use the existing quota and do not create paid image/video jobs. Account ownership is enforced by the service; there is no project/asset selection grant like a screenshot design editor.

## Quote, create and retrieve

1. Read `get_capabilities`, `get_account`, `list_models` and the relevant `get_generation_schema`. Preserve the user's model, mode, language, aspect ratio and budget when supported.
2. Resolve references to owned file IDs through `list_media`, upload or import. A draft declares `kind: "image" | "video"` plus current model parameters or `scenarioId`; unsupported combinations fail validation.
3. Call `quote_generation` with `{ "items": [draft] }`. Use its returned `generation` and `credits` unchanged for creation. The quote's `resolved` field is provider admission information, not the public draft to submit.
4. Submit `create_generation` with the shape below. Generate a new UUID for each deliberately new logical task. A user request to generate within an agreed budget is sufficient authorization; ask only for missing choices or a cost exceeding that budget.
5. Read `get_job` using the returned job identifier. Respect `pollAfterSeconds`, with at least ten seconds between polls per active job. Fetch renewed media URLs through `get_job` or `get_media_url` if needed.

Creation argument shape (replace placeholders with the exact quote and a fresh UUID):

```json
{
  "requestId": "<new UUID>",
  "expectedCredits": 80,
  "generation": {
    "kind": "image",
    "model": "<current model ID>",
    "prompt": "A small ceramic house in soft morning light"
  }
}
```

The `80` is illustrative, not a published price. Actual drafts may need additional fields from the schema. A quote does not reserve balance; creation can return `PRICE_CHANGED` or insufficient credits. Re-quote a rejected, unaccepted request and review its new cost before creating revised work.

Deliver task IDs, status, actual reported charges/refunds, the task details link and available result. State whether generation finished, whether you downloaded or inspected the media, and whether links expire. A submitted request or accepted batch is not a completed result.

## Batches and recovery

Quote up to twelve drafts together. `create_batch` takes an outer UUID and total credits; each child uses the same shape as `create_generation`, including a distinct UUID and its individual quoted credits:

```text
{
  requestId: batchUuid,
  expectedCredits: quote.totalCredits,
  items: quote.items.map((item, index) => ({
    requestId: childUuids[index],
    expectedCredits: item.credits,
    generation: item.generation
  }))
}
```

This is argument-construction pseudocode, not a runnable MCP call. Save the complete arguments before submitting. On timeout or an uncertain response, retry with the same outer/child UUIDs, quoted credits and drafts. Fresh IDs create new paid work; never rotate IDs merely to recover a connection.

The service preflights all children and persists accepted inputs before dispatch. Each task charges/refunds independently, so runtime failures can be partial. Use `get_batch` for combined progress, then `get_job` when you need a child's result URL. Recover accepted work before deciding whether a failed item needs a deliberately new attempt; do not resubmit successful children.

## References and uploads

- Existing media: paginate `list_media` with the exact `nextCursor`, then use an owned file ID. Do not substitute a local path or arbitrary URL for an ID.
- Local file: `create_upload` accepts optional `contentType` and byte `size`. Transfer the file to its `uploadUrl` using the returned method/encoding and multipart field `file`; allow your HTTP tool to construct the multipart boundary. Or open `uploadPageUrl` and sign in to the same account. Call `get_upload({uploadId})` until it returns the ready `fileId`.
- Public media: `import_media({url, requestId})` accepts a public HTTPS URL. Keep the same UUID and URL when retrying. Private network addresses, URL credentials, custom ports and redirects are rejected.

Accepted formats are JPEG, PNG, WebP, MP4, WAV and MP3, up to 10 MiB per file within the account's library limits. The server validates signatures and source duration. A client needs its own file-transfer/browser capability to upload bytes; MCP creates the upload route. If unavailable, use the browser upload page or have the user upload through the website.

Upload and download capabilities expire after ten minutes and depend on the live grant/key. Never put account bearer tokens in a URL or attach them to arbitrary media hosts. Do not publish capability URLs in logs, repository files or public issues. Renew an expired download instead of generating again.

## Quick Apps and staged stories

Use current `scenarios` and `modeCapabilities` from discovery to select compatible presets, then inspect `get_generation_schema({scenarioId})`. Fixed-template scenarios resolve their approved template on the server; do not invent template URLs. Vidu uses the ordinary `prompt` field. Motion transfer uses an owned video in `sourceMediaFileId`; source duration is read when `webOptions` is omitted.

For a staged fictional story, create its image with the `story`, wait for completion, then pass the image's owned file ID and the same story to the video stage. Quote each stage after its references exist. Independent batch children do not express dependencies. Only advertise image/video creation and configured scene/assist capabilities; no audio-only generation, timeline editing or automatic assembly is exposed.
