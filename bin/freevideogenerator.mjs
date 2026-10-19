#!/usr/bin/env node
import { parseArgs } from 'node:util';
import {
  checkService,
  configFor,
  installSkill,
  skillTarget,
} from '../lib/connect.mjs';

const help = `FreeVideoGenerator MCP connection helper (Node.js 20+)

  freevideogenerator-mcp config <codex|claude|cursor|zcode|gemini|kimi>
  freevideogenerator-mcp install-skill <codex|claude|zcode|custom> [--dir <skills-directory>] [--dry-run]
  freevideogenerator-mcp doctor

config prints a snippet; merge it into existing client settings, never replace them.
install-skill copies only the bundled skill. Existing directories are never overwritten.
--dir is the parent skills directory; the freevideogenerator subdirectory is added.
OAuth login and MCP registration remain in your client's own interface.
This helper is not a stdio MCP server and does not collect or store tokens.
`;

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      dir: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  });
  const [command, client] = positionals;
  if (values.help || !command) {
    process.stdout.write(help);
  } else {
    if (command !== 'install-skill' && (values.dir || values['dry-run']))
      throw new Error('--dir and --dry-run apply only to install-skill.');
    if (command === 'config' && positionals.length === 2) {
      process.stdout.write(configFor(client));
    } else if (command === 'install-skill' && positionals.length === 2) {
      const target = await installSkill(
        skillTarget(client, values.dir),
        values['dry-run'],
      );
      console.log(
        `${values['dry-run'] ? 'Would install' : 'Installed'}: ${target}`,
      );
      console.log(
        'Connect the remote MCP service separately and restart your agent to discover the skill.',
      );
    } else if (command === 'doctor' && positionals.length === 1) {
      console.log(await checkService());
    } else {
      throw new Error('Unknown command or arguments. Run with --help.');
    }
  }
} catch (error) {
  console.error(`FreeVideoGenerator: ${error.message}`);
  process.exitCode = 1;
}
