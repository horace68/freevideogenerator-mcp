# Media, batches and recovery

Read current tool schemas before constructing arguments. The server enforces ownership, permissions, model constraints, library limits and actual billing.

## Local and public references

`create_upload` accepts optional `contentType` and byte `size`. Its response includes `uploadId`, `uploadUrl`, `uploadPageUrl`, method, multipart encoding and field `file`. Use an available HTTP/file tool to send bytes with the specified multipart field; let that tool set the boundary. Otherwise open the upload page and sign in to the same account, or ask the user to upload there if the client cannot transfer files. This Skill cannot supply missing file/browser tools.

Call `get_upload({uploadId})` for the resulting owned `fileId`. The upload belongs to the connection that created it. Supported formats are JPEG, PNG, WebP, MP4, WAV and MP3, with a 10 MiB file limit and existing account library limits. An expired unfinished upload needs a new capability.

For a public HTTPS source use `import_media({url, requestId})`, with a new UUID per intended import and the same UUID/URL on retries. The server rejects private addresses, URL credentials, custom ports and redirects. Import the media before using its file ID in generation.

Map owned IDs to the fields exposed by the current schema: `referenceFileIds`, `sourceMediaFileId` or `referenceAudioFileIds`. Do not exchange these fields arbitrarily. Use a fresh `get_media_url({fileId})` or `get_job` result when a download expires. Ten-minute capability URLs are sensitive; never forward the account's bearer token to a media host.

## Batch submission

1. Quote independent drafts with `quote_generation({items: drafts})`.
2. Assign each returned item a distinct stable UUID and construct `{requestId, expectedCredits: item.credits, generation: item.generation}`.
3. Call `create_batch` with a separate outer UUID, `expectedCredits: quote.totalCredits`, and those child objects. Maximum: twelve items.
4. Preserve the complete original arguments. Recover unknown acceptance by retrying exactly or reading the returned batch/job IDs.
5. Read `get_batch` for ordered results and `get_job` for a child's private result URL and charge/refund state. Respect at least ten seconds between polls per active job.

A preflight validates the batch before acceptance, but provider/runtime failures can be partial. Keep successful children. Re-quote only deliberately new work after establishing what happened to the original attempt. Never rotate IDs just to escape a transport error. Billing/refunds remain server-owned outcomes.

## Quick Apps and staged stories

Use `get_capabilities.scenarios`, their `modeCapabilities`, and `get_generation_schema({scenarioId})` to choose compatible presets. Fixed templates resolve through the server allowlist. Vidu accepts the ordinary `prompt` field. Motion transfer requires an owned video in `sourceMediaFileId`; when `webOptions` is omitted its duration comes from that file.

For a supported fictional-story flow, create the image with `story`, wait for a completed owned output file, then quote/create the video using that file ID and the same story. Preserve the story across stages. Batch items are independent and cannot reference an unfinished sibling's future output.

## Failure handling

- Missing scope or revoked access: reauthorize through the client; never retry with cookies or another account's files.
- `PRICE_CHANGED`: for rejected unaccepted work, quote again and check the user's budget. Do not silently increase it.
- Timeout/uncertain submission: retain UUIDs, expected credits and drafts and recover the original work.
- Rate limit: obey `Retry-After`, reduce polling and prefer combined batch reads.
- Insufficient credits/quota or unsupported inputs: explain the actionable limit. Do not repeatedly submit or purchase credits.
- Partial batch failure: report each outcome and its charge/refund state; reattempt only intended failed work.

When handing off, report actual status, IDs, task links and available results. State if completion, download or visual review remains pending. Never claim a video is assembled, published or inspected from a task-acceptance response.
