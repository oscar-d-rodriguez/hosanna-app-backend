const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { Router } = require('express');

const { createApp } = require('../src/app');
const { createContentRouter } = require('../src/api/routes/content.routes');

function buildEnvironment(overrides = {}) {
  return {
    isProduction: false,
    port: 0,
    nodeEnv: 'test',
    contentful: {
      previewKey: 'preview-key',
      previewToken: 'preview-token',
      webhookSecret: 'webhook-secret',
      ...overrides.contentful,
    },
    cmsCacheTtlSeconds: 300,
    websiteRevalidateUrl: '',
    ...overrides,
  };
}

function createTestApp({ contentService, environmentOverrides, eventsRouter } = {}) {
  const environment = buildEnvironment(environmentOverrides);
  const contentRouter = createContentRouter({
    cmsService: contentService || {
      async getSiteConfiguration() {
        return { source: 'contentful', locale: 'en-US', preview: false, siteConfiguration: {} };
      },
      invalidateCmsCache() {},
    },
    environment,
  });

  return createApp({
    environment,
    contentRouter,
    eventsRouter:
      eventsRouter || (() => {
        const router = Router();
        router.get('/', (req, res) => {
          res.json({ router: 'events' });
        });
        return router;
      })(),
  });
}

function request(server, { method = 'GET', path = '/', headers = {}, body } = {}) {
  const address = server.address();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        method,
        path,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function withServer(app, callback) {
  const server = app.listen(0);

  try {
    return await callback(server);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('unsupported locale returns 400', async () => {
  const app = createTestApp();

  await withServer(app, async (server) => {
    const response = await request(server, { path: '/api/content/site-configuration?locale=fr' });
    assert.equal(response.status, 400);
    assert.equal(JSON.parse(response.body).error, 'Unsupported locale');
  });
});

test('preview without a valid preview key returns 401', async () => {
  const app = createTestApp();

  await withServer(app, async (server) => {
    const response = await request(server, { path: '/api/content/site-configuration?preview=1' });
    assert.equal(response.status, 401);
    assert.equal(JSON.parse(response.body).error, 'Invalid preview key');
  });
});

test('preview with missing preview configuration returns 503', async () => {
  const app = createTestApp({
    environmentOverrides: {
      contentful: {
        previewKey: 'preview-key',
        previewToken: '',
      },
    },
  });

  await withServer(app, async (server) => {
    const response = await request(server, { path: '/api/content/site-configuration?preview=1' });
    assert.equal(response.status, 503);
    assert.match(JSON.parse(response.body).error, /Preview mode is unavailable/);
  });
});

test('Existing /health endpoint still works', async () => {
  const app = createTestApp();

  await withServer(app, async (server) => {
    const response = await request(server, { path: '/health' });
    const payload = JSON.parse(response.body);

    assert.equal(response.status, 200);
    assert.equal(payload.status, 'ok');
    assert.equal(typeof payload.timestamp, 'string');
  });
});

test('Existing /api/events router registration remains unchanged', async () => {
  const app = createTestApp();

  await withServer(app, async (server) => {
    const response = await request(server, { path: '/api/events' });
    const payload = JSON.parse(response.body);

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { router: 'events' });
  });
});
