import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../cloudflare/openai-verification/worker.mjs';

const endpoint =
  'https://freevideogenerator.app/.well-known/openai-apps-challenge';
const env = { OPENAI_APPS_CHALLENGE: 'public-verification-example-token' };

test('verification returns only the configured plain text token', async () => {
  const response = worker.fetch(new Request(endpoint), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), env.OPENAI_APPS_CHALLENGE);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('verification does not serve other paths or hosts', () => {
  for (const url of [
    'https://freevideogenerator.app/api/mcp',
    `${endpoint}/other`,
    'https://another.example/.well-known/openai-apps-challenge',
  ]) {
    assert.equal(worker.fetch(new Request(url), env).status, 404);
  }
});

test('verification rejects writes and an unconfigured token', () => {
  const write = worker.fetch(new Request(endpoint, { method: 'POST' }), env);
  assert.equal(write.status, 405);
  assert.equal(write.headers.get('allow'), 'GET, HEAD');
  assert.equal(worker.fetch(new Request(endpoint), {}).status, 503);
});

test('HEAD verifies the route without returning a body', async () => {
  const response = worker.fetch(new Request(endpoint, { method: 'HEAD' }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
});
