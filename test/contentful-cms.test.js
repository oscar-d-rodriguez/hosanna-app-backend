const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentfulService } = require('../src/services/contentful.service');
const { createCmsService } = require('../src/services/cms.service');

function createMockCache() {
  const store = new Map();

  return {
    store,
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    set(key, value) {
      store.set(key, value);
    },
    deleteByPrefix(prefix) {
      for (const key of [...store.keys()]) {
        if (key.startsWith(prefix)) {
          store.delete(key);
        }
      }
    },
  };
}

test('mapAsset produces an absolute HTTPS URL from a protocol-relative Contentful URL', () => {
  const service = createContentfulService();

  const result = service.mapAsset({
    fields: {
      file: {
        url: '//images.ctfassets.net/eo9prlow/image/upload/v1/example.jpg',
      },
    },
  });

  assert.equal(result, 'https://images.ctfassets.net/eo9prlow/image/upload/v1/example.jpg');
});

test('SEO fallback maps socialTitle from pageTitle when socialTitle is missing', () => {
  const service = createContentfulService();

  const result = service.normalizeSeoMetadata({
    fields: {
      pageTitle: 'Hosanna Church',
      description: 'A church family',
    },
  });

  assert.equal(result.pageTitle, 'Hosanna Church');
  assert.equal(result.socialTitle, 'Hosanna Church');
});

test('SEO fallback maps socialDescription from description when socialDescription is missing', () => {
  const service = createContentfulService();

  const result = service.normalizeSeoMetadata({
    fields: {
      pageTitle: 'Hosanna Church',
      description: 'A church family',
    },
  });

  assert.equal(result.description, 'A church family');
  assert.equal(result.socialDescription, 'A church family');
});

test('Site Configuration maps organizationName, organizationDescription, organizationLogo, and defaultSeoMetadata', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: 'A bilingual church in Bellevue.',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: 'Primary brand mark',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A bilingual church in Bellevue.',
          socialImage: {
            fields: {
              title: 'Social Image',
              description: 'Open graph image',
              file: {
                url: '//images.ctfassets.net/eo9prlow/social.jpg',
                contentType: 'image/jpeg',
                details: {
                  image: {
                    width: 1200,
                    height: 630,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  assert.deepEqual(result, {
    internalName: 'Main site configuration',
    siteKey: 'hosanna-main',
    organizationName: 'Hosanna Church',
    organizationDescription: 'A bilingual church in Bellevue.',
    organizationLogo: {
      url: 'https://images.ctfassets.net/eo9prlow/logo.png',
      title: 'Hosanna Logo',
      description: 'Primary brand mark',
      width: 640,
      height: 320,
      contentType: 'image/png',
    },
    defaultSeoMetadata: {
      pageTitle: 'Hosanna Church',
      description: 'A bilingual church in Bellevue.',
      socialTitle: 'Hosanna Church',
      socialDescription: 'A bilingual church in Bellevue.',
      socialImage: {
        url: 'https://images.ctfassets.net/eo9prlow/social.jpg',
        title: 'Social Image',
        description: 'Open graph image',
        width: 1200,
        height: 630,
        contentType: 'image/jpeg',
      },
      hideFromSearchEngines: false,
    },
  });
});

test('optional organizationDescription can be absent', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
    },
  });

  assert.equal(Object.hasOwn(result, 'organizationDescription'), false);
});

test('optional text fields trim trailing newlines and spaces', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: 'Una iglesia sin limites\n',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: 'Brand mark\n',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A church family',
          socialTitle: ' Hosanna Social\n',
          socialDescription: ' Social description\n',
        },
      },
    },
  });

  assert.equal(result.organizationDescription, 'Una iglesia sin limites');
  assert.equal(result.organizationLogo.description, 'Brand mark');
  assert.equal(result.defaultSeoMetadata.socialTitle, 'Hosanna Social');
  assert.equal(result.defaultSeoMetadata.socialDescription, 'Social description');
});

test('whitespace-only optional values normalize to null or fallback values', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: '   \n\t ',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: '   \n',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A church family',
          socialTitle: '   \n',
          socialDescription: '\t\n',
        },
      },
    },
  });

  assert.equal(Object.hasOwn(result, 'organizationDescription'), false);
  assert.equal(result.organizationLogo.description, null);
  assert.equal(result.defaultSeoMetadata.socialTitle, 'Hosanna Church');
  assert.equal(result.defaultSeoMetadata.socialDescription, 'A church family');
});

test('Contentful failure returns source="unavailable" and siteConfiguration=null', async () => {
  const cmsService = createCmsService({
    contentfulService: {
      getSiteConfiguration: async () => {
        throw new Error('Contentful is down');
      },
    },
    cacheService: createMockCache(),
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  const result = await cmsService.getSiteConfiguration({ locale: 'en-US', preview: false });

  assert.equal(result.source, 'unavailable');
  assert.equal(result.siteConfiguration, null);
});

test('A cached response avoids a second Contentful request', async () => {
  let calls = 0;
  const cmsService = createCmsService({
    contentfulService: {
      getSiteConfiguration: async () => {
        calls += 1;
        return { internalName: 'Cached config' };
      },
    },
    cacheService: createMockCache(),
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  const first = await cmsService.getSiteConfiguration({ locale: 'en-US', preview: false });
  const second = await cmsService.getSiteConfiguration({ locale: 'en-US', preview: false });

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('Webhook invalidation removes CMS cache entries', () => {
  const cache = createMockCache();
  cache.set('cms:site-configuration:en-US:published', { ok: true });
  cache.set('cms:site-configuration:es:published', { ok: true });
  cache.set('events:all', { ok: true });

  const cmsService = createCmsService({
    cacheService: cache,
    contentfulService: { getSiteConfiguration: async () => null },
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  cmsService.invalidateCmsCache();

  assert.equal(cache.get('cms:site-configuration:en-US:published'), null);
  assert.equal(cache.get('cms:site-configuration:es:published'), null);
  assert.deepEqual(cache.get('events:all'), { ok: true });
});
