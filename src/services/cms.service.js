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
  function buildHomePageCacheKey({ locale, preview }) {
    return `cms:pages:home:${locale}:${preview ? 'preview' : 'published'}`;
  }

  function buildCacheKey({ locale, preview }) {
    return `cms:site-configuration:${locale}:${preview ? 'preview' : 'published'}`;
  }

  function buildMinistryCacheKey({ slug, locale, preview }) {
    return `cms:ministry:${environment.contentful.siteKey}:${slug}:${locale}:${preview ? 'preview' : 'published'}`;
  }

  async function getHomePage({ locale = 'en-US', preview = false, skipCache = false } = {}) {
    const key = buildHomePageCacheKey({ locale, preview });

    if (!skipCache) {
      const cached = cacheService.get(key);
      if (cached) {
        return cached;
      }
    }

    try {
      const remote = await contentfulService.getHomePage({ locale, preview });
      const payload = {
        source: remote ? 'contentful' : 'unavailable',
        locale,
        page: remote || null,
      };

      cacheService.set(key, payload, environment.cmsCacheTtlSeconds);
      return payload;
    } catch (error) {
      logger.error({ error, locale, preview }, 'Failed to fetch home page from Contentful');

      return {
        source: 'unavailable',
        locale,
        page: null,
      };
    }
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

  async function getMinistry({ slug, locale = 'en-US', preview = false, skipCache = false } = {}) {
    const key = buildMinistryCacheKey({ slug, locale, preview });

    if (!skipCache) {
      const cached = cacheService.get(key);
      if (cached) {
        return cached;
      }
    }

    try {
      const remote = await contentfulService.getMinistry({ slug, locale, preview });
      const payload = {
        source: remote ? 'contentful' : 'unavailable',
        locale,
        ministry: remote || null,
      };

      cacheService.set(key, payload, environment.cmsCacheTtlSeconds);
      return payload;
    } catch (error) {
      logger.error({ error, slug, locale, preview }, 'Failed to fetch ministry from Contentful');

      return {
        source: 'unavailable',
        locale,
        ministry: null,
      };
    }
  }

  function invalidateCmsCache() {
    cacheService.deleteByPrefix('cms:');
  }

  return {
    getHomePage,
    getSiteConfiguration,
    getMinistry,
    invalidateCmsCache,
    buildCacheKey,
    buildHomePageCacheKey,
    buildMinistryCacheKey,
  };
}

const defaultService = createCmsService();

module.exports = {
  createCmsService,
  ...defaultService,
};
