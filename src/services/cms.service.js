const cache = require('./cache.service');
const contentfulService = require('./contentful.service');
const environment = require('../config/environment');
const logger = require('../config/logger');

const DEFAULT_HOME_CONTENT = {
  locale: 'en-US',
  updatedAt: null,
  page: {
    title: 'Home',
    slug: '/',
    sections: [],
  },
  sections: [],
  hero: {
    welcome: 'WELCOME',
    subtitle: 'A PLACE TO BELONG',
    ctaLabel: 'VISIT US',
    slides: [
      { title: 'Community', imageUrl: '/images/hero-0.jpg', imageAlt: 'Hosanna Church Community' },
      { title: 'Worship', imageUrl: '/images/hero-1.jpg', imageAlt: 'Hosanna Church Worship' },
      { title: 'Prayer', imageUrl: '/images/hero-2.jpg', imageAlt: 'Hosanna Church Prayer' },
      { title: 'Service', imageUrl: '/images/hero-3.jpg', imageAlt: 'Hosanna Church Service' },
    ],
  },
  about: {
    eyebrow: 'ABOUT',
    title: 'OUR MISSION',
    description: 'We are a community of faith, hope, and love.',
    cards: [
      { title: 'Mission', description: 'Sharing the gospel and serving our community.' },
      { title: 'Vision', description: 'Building disciples rooted in Christ and compassion.' },
      { title: 'Values', description: 'Faith, family, service, and spiritual growth.' },
    ],
  },
  ministries: [],
  serviceTimes: [],
  livestream: null,
  cta: null,
};

function buildCacheKey({ locale, preview }) {
  return `cms:home:${locale}:${preview ? 'preview' : 'published'}`;
}

async function getHomeContent({ locale = 'en-US', preview = false, skipCache = false }) {
  const key = buildCacheKey({ locale, preview });

  if (!skipCache) {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
  }

  try {
    const remote = await contentfulService.getHomePage({ locale, preview });
    const payload = {
      source: remote ? 'contentful' : 'fallback',
      locale,
      preview,
      home: remote || { ...DEFAULT_HOME_CONTENT, locale },
    };

    cache.set(key, payload, environment.cmsCacheTtlSeconds);
    return payload;
  } catch (error) {
    logger.error({ error, locale, preview }, 'Failed to fetch home content from Contentful');

    return {
      source: 'fallback',
      locale,
      preview,
      home: { ...DEFAULT_HOME_CONTENT, locale },
    };
  }
}

function invalidateHomeContentCache() {
  cache.deleteByPrefix('cms:home:');
}

module.exports = {
  getHomeContent,
  invalidateHomeContentCache,
};
