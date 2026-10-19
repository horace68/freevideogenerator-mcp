# Publishing to the official MCP Registry

[server.json](../server.json) describes the hosted Streamable HTTP service:

- Name: `io.github.horace68/freevideogenerator`
- Descriptor/service version: `1.0.1`
- Remote: `https://freevideogenerator.app/api/mcp`
- Public repository: `https://github.com/horace68/freevideogenerator-mcp`

It contains only a `remotes` entry. The local connection helper is not a stdio server or npm distribution, so no `packages` entry or npm publication is required. OAuth is discovered by clients from the hosted HTTP challenge; the descriptor does not require a static Authorization header or contain credentials. See the [official remote-server guide](https://modelcontextprotocol.io/registry/remote-servers).

## Validate and publish

Install the official [`mcp-publisher`](https://github.com/modelcontextprotocol/registry) CLI. On macOS, `brew install mcp-publisher` is supported. For a downloaded binary, verify it against the official release checksums. Version `v1.8.1` was used for this repository's first validation.

From this repository:

```sh
npm run check
npm test
npm pack --dry-run
node bin/freevideogenerator.mjs doctor
mcp-publisher validate server.json
```

Commit and push the reviewed public files, then authenticate as the GitHub namespace owner and publish:

```sh
mcp-publisher login github --registry=https://registry.modelcontextprotocol.io
mcp-publisher publish server.json
```

GitHub authorization must cover `io.github.horace68/*`. Keep publisher tokens in the CLI's user configuration store, outside the repository. The `--registry` flag belongs to `login`; publication uses the registry saved in that login. The helper version `0.1.0` is separate from the remote descriptor version `1.0.1`. [Official CLI reference](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md).

## Read back publication

Retrieve the exact version after publishing:

```sh
curl --fail --silent --show-error 'https://registry.modelcontextprotocol.io/v0.1/servers/io.github.horace68%2Ffreevideogenerator/versions/1.0.1'
```

Check the returned name, version, repository, remote URL, active status and latest-version metadata. A successful CLI exit alone is insufficient. The record is also discoverable through the [Registry search API](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.horace68%2Ffreevideogenerator).

For updates, read the current record first and use a new descriptor version for changed published metadata. Do not blindly retry an existing name/version or claim that Registry publication certifies client compatibility. Registry records are metadata; authenticated service use, optional Skill installation and other client directories have separate lifecycles. [Official publishing quickstart](https://modelcontextprotocol.io/registry/quickstart).
