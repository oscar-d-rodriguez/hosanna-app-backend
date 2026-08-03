const defaultCacheService = require('./cache.service');
const defaultContentfulService = require('./contentful.service');
const defaultEnvironment = require('../config/environment');
const defaultLogger = require('../config/logger');

function createCmsService({
  cacheService = defaultCacheService,
  contentfulService = defaultContentfulService,
  environment = defaultEnvironment,
  logger = defaultLogger,
} = {}) {
  function buildCacheKey({ locale, preview }) {
    return `cms:site-configuration:${locale}:${preview ? 'preview' : 'published'}`;
  }

  async function getSiteConfiguration({ locale = 'en-US', preview = false, skipCache = false } = {}) {
    const key = buildCacheKey({ locale, preview });

    if (!skipCache) {
      const cached = cacheService.get(key);
      if (cached) {
        return cached;
      }
    }

    try {
      const remote = await contentfulService.getSiteConfiguration({ locale, preview });
      const payload = {
        source: remote ? 'contentful' : 'unavailable',
        locale,
        preview,
        siteConfiguration: remote || null,
      };

      cacheService.set(key, payload, environment.cmsCacheTtlSeconds);
      return payload;
    } catch (error) {
      logger.error({ error, locale, preview }, 'Failed to fetch site configuration from Contentful');

      return {
        source: 'unavailable',
        locale,
        preview,
        siteConfiguration: null,
      };
    }
  }

  function invalidateCmsCache() {
    cacheService.deleteByPrefix('cms:');
  }

  return {
    getSiteConfiguration,
    invalidateCmsCache,
    buildCacheKey,
  };
}

const defaultService = createCmsService();

module.exports = {
  createCmsService,
  ...defaultService,
};
