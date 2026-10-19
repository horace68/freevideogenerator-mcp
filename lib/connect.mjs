import { cp, lstat, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const endpoint = 'https://freevideogenerator.app/api/mcp';
export const issuer = 'https://freevideogenerator.app/api/auth';
export const resourceMetadataUrl =
  'https://freevideogenerator.app/.well-known/oauth-protected-resource/api/mcp';
export const authorizationMetadataUrl =
  'https://freevideogenerator.app/.well-known/oauth-authorization-server/api/auth';
export const skillName = 'freevideogenerator';
const source = fileURLToPath(
  new URL('../skills/freevideogenerator/', import.meta.url),
);

export function configFor(client) {
  switch (client) {
    case 'codex':
      return `[mcp_servers.freevideogenerator]\nurl = "${endpoint}"\n`;
    case 'claude':
      return (
        JSON.stringify(
          { mcpServers: { freevideogenerator: { type: 'http', url: endpoint } } },
          null,
          2,
        ) + '\n'
      );
    case 'zcode':
      // ZCode user-scope file: ~/.zcode/cli/config.json under mcp.servers.
      return (
        JSON.stringify(
          {
            mcp: {
              servers: {
                freevideogenerator: { type: 'http', url: endpoint },
              },
            },
          },
          null,
          2,
        ) + '\n'
      );
    case 'gemini':
      return (
        JSON.stringify(
          {
            mcpServers: {
              freevideogenerator: { httpUrl: endpoint, oauth: { enabled: true } },
            },
          },
          null,
          2,
        ) + '\n'
      );
    case 'cursor':
    case 'kimi':
      return (
        JSON.stringify(
          { mcpServers: { freevideogenerator: { url: endpoint } } },
          null,
          2,
        ) + '\n'
      );
    default:
      throw new Error('Choose codex, claude, cursor, zcode, gemini, or kimi.');
  }
}

export function skillTarget(client, destination, home = homedir()) {
  if (!['codex', 'claude', 'zcode', 'custom'].includes(client)) {
    throw new Error(
      'Choose codex, claude, zcode, or custom --dir <skills-directory>.',
    );
  }
  if (destination) return join(resolve(destination), skillName);
  if (client === 'custom')
    throw new Error('custom requires --dir <skills-directory>.');
  return join(
    home,
    client === 'codex' || client === 'zcode' ? '.agents' : '.claude',
    'skills',
    skillName,
  );
}

export async function installSkill(target, dryRun = false) {
  // Refuse existing folders or symlinks; never replace a user's modified skill.
  try {
    await lstat(target);
    throw new Error(
      `Already exists: ${target}. Move it aside before installing an update.`,
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (dryRun) return target;
  await readFile(join(source, 'SKILL.md'), 'utf8');
  await mkdir(dirname(target), { recursive: true });
  await mkdir(target); // Exclusive creation also protects against concurrent installs.
  try {
    for (const entry of await readdir(source)) {
      await cp(join(source, entry), join(target, entry), {
        recursive: true,
        force: false,
        errorOnExist: true,
      });
    }
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }
  return target;
}

export async function checkService(fetcher = fetch) {
  const options = () => ({
    redirect: 'error',
    credentials: 'omit',
    signal: AbortSignal.timeout(10000),
    headers: { Accept: 'application/json' },
  });
  const response = await fetcher(resourceMetadataUrl, options());
  if (response.status === 404)
    throw new Error(
      'The hosted MCP service is not enabled yet (metadata returned 404). Installing a skill does not enable the server.',
    );
  if (!response.ok)
    throw new Error(`Service metadata returned HTTP ${response.status}.`);
  const data = await response.json();
  if (
    data.resource !== endpoint ||
    !Array.isArray(data.authorization_servers) ||
    !data.authorization_servers.includes(issuer)
  ) {
    throw new Error(
      'Unexpected OAuth resource metadata. Check service deployment before signing in.',
    );
  }
  const authorization = await fetcher(authorizationMetadataUrl, options());
  if (!authorization.ok)
    throw new Error(
      `Authorization metadata returned HTTP ${authorization.status}.`,
    );
  const auth = await authorization.json();
  if (
    auth.issuer !== issuer ||
    auth.authorization_endpoint !== `${issuer}/oauth2/authorize` ||
    auth.token_endpoint !== `${issuer}/oauth2/token` ||
    !auth.code_challenge_methods_supported?.includes('S256') ||
    !auth.response_types_supported?.includes('code') ||
    !auth.token_endpoint_auth_methods_supported?.includes('none')
  ) {
    throw new Error(
      'Unexpected authorization metadata or missing public-client PKCE S256 support.',
    );
  }
  const challenge = await fetcher(endpoint, {
    ...options(),
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'freevideogenerator-mcp-doctor', version: '0.1.0' },
      },
    }),
  });
  const authenticate = challenge.headers.get('www-authenticate') ?? '';
  if (
    challenge.status !== 401 ||
    !/^Bearer\s/i.test(authenticate) ||
    !authenticate.includes(`resource_metadata="${resourceMetadataUrl}"`)
  ) {
    throw new Error(
      `Expected an OAuth HTTP 401 challenge from the MCP endpoint; received HTTP ${challenge.status} with unexpected discovery headers.`,
    );
  }
  await challenge.body?.cancel();
  return 'Public OAuth discovery, PKCE S256 and the HTTP 401 challenge are available. Complete authorization in your MCP client; this is not an end-to-end compatibility or generation test.';
}
