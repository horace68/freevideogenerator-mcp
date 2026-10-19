import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  lstat,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  checkService,
  configFor,
  endpoint,
  issuer,
  resourceMetadataUrl,
  authorizationMetadataUrl,
  installSkill,
  skillTarget,
} from '../lib/connect.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = join(root, 'bin/freevideogenerator.mjs');
async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), 'freevideogenerator-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('client snippets preserve each native HTTP transport format', () => {
  assert.equal(
    JSON.parse(configFor('claude')).mcpServers.freevideogenerator.type,
    'http',
  );
  assert.equal(
    JSON.parse(configFor('zcode')).mcp.servers.freevideogenerator.type,
    'http',
  );
  assert.equal(
    JSON.parse(configFor('gemini')).mcpServers.freevideogenerator.httpUrl,
    endpoint,
  );
  assert.equal(
    JSON.parse(configFor('kimi')).mcpServers.freevideogenerator.url,
    endpoint,
  );
  assert.equal(
    JSON.parse(configFor('cursor')).mcpServers.freevideogenerator.url,
    endpoint,
  );
  assert.match(configFor('codex'), /\[mcp_servers\.freevideogenerator\]/);
  assert.throws(() => configFor('unknown'), /Choose/);
});

test('checked-in examples match generated configuration', async () => {
  for (const [client, name] of Object.entries({
    codex: 'codex.toml',
    claude: 'claude.mcp.json',
    cursor: 'cursor.mcp.json',
    zcode: 'zcode.config.json',
    gemini: 'gemini.settings.json',
    kimi: 'kimi.mcp.json',
  })) {
    assert.equal(
      await readFile(join(root, 'examples', name), 'utf8'),
      configFor(client),
    );
  }
});

test('installs the complete skill into an explicit path, preserving neighboring files', async (t) => {
  const parent = await temporary(t);
  await writeFile(join(parent, 'unrelated.txt'), 'keep');
  const target = skillTarget('custom', parent);
  await installSkill(target);
  assert.equal(
    await readFile(join(target, 'SKILL.md'), 'utf8'),
    await readFile(join(root, 'skills/freevideogenerator/SKILL.md'), 'utf8'),
  );
  assert.match(
    await readFile(join(target, 'agents/openai.yaml'), 'utf8'),
    /streamable_http/,
  );
  assert.equal(
    await readFile(join(target, 'references/media-and-recovery.md'), 'utf8'),
    await readFile(
      join(root, 'skills/freevideogenerator/references/media-and-recovery.md'),
      'utf8',
    ),
  );
  assert.equal(await readFile(join(parent, 'unrelated.txt'), 'utf8'), 'keep');
});

test('refuses to overwrite an installed and customized skill', async (t) => {
  const target = skillTarget('custom', await temporary(t));
  await installSkill(target);
  await writeFile(join(target, 'SKILL.md'), 'custom user edits');
  await assert.rejects(installSkill(target), /Already exists/);
  assert.equal(
    await readFile(join(target, 'SKILL.md'), 'utf8'),
    'custom user edits',
  );
});

test('refuses symlink destinations', async (t) => {
  const parent = await temporary(t);
  const elsewhere = await temporary(t);
  const target = join(parent, 'freevideogenerator');
  await symlink(
    elsewhere,
    target,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await assert.rejects(installSkill(target), /Already exists/);
  assert.equal((await lstat(target)).isSymbolicLink(), true);
});

test('dry run creates no files or target directory', async (t) => {
  const target = join(await temporary(t), 'not-created', 'freevideogenerator');
  await installSkill(target, true);
  await assert.rejects(lstat(target), { code: 'ENOENT' });
});

test('client paths use their skill directories and custom requires a destination', () => {
  const fakeHome = join(tmpdir(), 'fake-agent-home');
  assert.equal(
    skillTarget('codex', undefined, fakeHome),
    join(fakeHome, '.agents/skills/freevideogenerator'),
  );
  assert.equal(
    skillTarget('zcode', undefined, fakeHome),
    join(fakeHome, '.agents/skills/freevideogenerator'),
  );
  assert.equal(
    skillTarget('claude', undefined, fakeHome),
    join(fakeHome, '.claude/skills/freevideogenerator'),
  );
  assert.throws(() => skillTarget('custom'), /requires --dir/);
  assert.throws(() => skillTarget('unknown'), /Choose/);
});

test('CLI installation handles paths with spaces and does not launch a shell', async (t) => {
  const directory = join(await temporary(t), 'skills with spaces');
  const output = execFileSync(
    process.execPath,
    [cli, 'install-skill', 'custom', '--dir', directory],
    { encoding: 'utf8' },
  );
  assert.match(output, /Installed:/);
  assert.equal(
    (await lstat(join(directory, 'freevideogenerator/SKILL.md'))).isFile(),
    true,
  );
});

test('CLI rejects invalid commands, unused flags and unknown options', () => {
  for (const args of [
    ['bad'],
    ['config', 'codex', '--dir', 'ignored'],
    ['install-skill', 'codex', '--force'],
    ['doctor', 'extra'],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FreeVideoGenerator:/);
  }
});

function discoveryFetcher(overrides = {}, seen = []) {
  const responses = {
    [resourceMetadataUrl]: () => Response.json({
      resource: endpoint,
      authorization_servers: [issuer],
    }),
    [authorizationMetadataUrl]: () => Response.json({
      issuer,
      authorization_endpoint: `${issuer}/oauth2/authorize`,
      token_endpoint: `${issuer}/oauth2/token`,
      response_types_supported: ['code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
    }),
    [endpoint]: () => new Response('{}', {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl}"`,
      },
    }),
    ...overrides,
  };
  return async (url, options) => {
    seen.push({ url, options });
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.equal(new Headers(options.headers).has('authorization'), false);
    assert.equal(new Headers(options.headers).has('cookie'), false);
    assert.ok(options.signal instanceof AbortSignal);
    assert.ok(Object.hasOwn(responses, url), `Unexpected diagnostic URL: ${url}`);
    return responses[url]();
  };
}

test('doctor checks only public discovery and an unauthenticated initialize', async () => {
  const seen = [];
  assert.match(await checkService(discoveryFetcher({}, seen)), /not an end-to-end/);
  assert.deepEqual(seen.map(({ url }) => url), [
    resourceMetadataUrl,
    authorizationMetadataUrl,
    endpoint,
  ]);
  const { options } = seen.at(-1);
  assert.equal(options.method, 'POST');
  assert.equal(JSON.parse(options.body).method, 'initialize');
});

test('doctor reports disabled and unexpected resource metadata', async () => {
  await assert.rejects(
    checkService(async () => new Response('', { status: 404 })),
    /not enabled/,
  );
  await assert.rejects(
    checkService(async () =>
      Response.json({ resource: 'wrong', authorization_servers: [] }),
    ),
    /Unexpected/,
  );
  await assert.rejects(
    checkService(async () => new Response('', { status: 503 })),
    /HTTP 503/,
  );
});

test('doctor rejects an unexpected issuer, token host or missing PKCE', async () => {
  const good = {
    issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  };
  for (const change of [
    { issuer: 'https://unexpected.example' },
    { token_endpoint: 'https://unexpected.example/token' },
    { code_challenge_methods_supported: ['plain'] },
    { token_endpoint_auth_methods_supported: ['client_secret_basic'] },
  ]) {
    await assert.rejects(checkService(discoveryFetcher({
      [authorizationMetadataUrl]: () => Response.json({ ...good, ...change }),
    })), /Unexpected authorization/);
  }
  await assert.rejects(checkService(discoveryFetcher({
    [authorizationMetadataUrl]: () => new Response('', { status: 502 }),
  })), /Authorization metadata returned HTTP 502/);
});

test('doctor rejects a missing challenge, wrong metadata link and unavailable endpoint', async () => {
  for (const response of [
    () => Response.json({}),
    () => new Response('', { status: 401 }),
    () => new Response('', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer resource_metadata="https://unexpected.example"' },
    }),
    () => new Response('', { status: 503 }),
  ]) {
    await assert.rejects(checkService(discoveryFetcher({
      [endpoint]: response,
    })), /Expected an OAuth HTTP 401/);
  }
});

test('doctor propagates network failures instead of reporting success', async () => {
  await assert.rejects(checkService(async () => {
    throw new Error('connection unavailable');
  }), /connection unavailable/);
});

test('registry metadata describes the hosted remote instead of the local helper', async () => {
  const descriptor = JSON.parse(await readFile(join(root, 'server.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(descriptor.name, 'io.github.horace68/freevideogenerator');
  assert.deepEqual(descriptor.remotes, [{ type: 'streamable-http', url: endpoint }]);
  assert.equal(Object.hasOwn(descriptor, 'packages'), false);
  assert.equal(descriptor.repository.url + '.git', pkg.repository.url.replace(/^git\+/, ''));
  assert.equal(pkg.private, true);
  assert.ok(pkg.files.includes('server.json'));
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    assert.equal(Object.hasOwn(pkg.scripts, hook), false);
  }
});
