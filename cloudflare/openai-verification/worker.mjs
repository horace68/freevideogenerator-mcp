/// <reference path="./worker-configuration.d.ts" />

const HOSTNAME = 'freevideogenerator.app';
const CHALLENGE_PATH = '/.well-known/openai-apps-challenge';
const HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

/** @satisfies {ExportedHandler<Env>} */
export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== HOSTNAME || url.pathname !== CHALLENGE_PATH) {
      return new Response('Not found', { status: 404, headers: HEADERS });
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...HEADERS, Allow: 'GET, HEAD' },
      });
    }
    const token = env.OPENAI_APPS_CHALLENGE?.trim() ?? '';
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
      return new Response('Verification not configured', {
        status: 503,
        headers: HEADERS,
      });
    }
    return new Response(request.method === 'HEAD' ? null : token, {
      headers: HEADERS,
    });
  },
};
