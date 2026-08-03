const { createClient } = require('contentful');
const environment = require('../config/environment');
const logger = require('../config/logger');

const PAGE_CONTENT_TYPE = 'page';
const LEGACY_HOME_PAGE_CONTENT_TYPE = 'homePage';

function resolveLinkList(items, mapper) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => mapper(item, index))
    .filter((item) => Boolean(item));
}

function getContentTypeId(entry) {
  return entry?.sys?.contentType?.sys?.id || '';
}

function parseSettingsJson(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function hasConfig() {
  const cfg = environment.contentful;
  return Boolean(cfg.spaceId && cfg.environmentId && cfg.deliveryToken);
}

function buildClient({ preview }) {
  const cfg = environment.contentful;
  const accessToken = preview ? cfg.previewToken : cfg.deliveryToken;

  if (!cfg.spaceId || !cfg.environmentId || !accessToken) {
    return null;
  }

  return createClient({
    space: cfg.spaceId,
    environment: cfg.environmentId,
    accessToken,
    host: preview ? 'preview.contentful.com' : 'cdn.contentful.com',
    timeout: cfg.requestTimeoutMs,
  });
}

function mapAssetUrl(asset) {
  const maybeUrl = asset?.fields?.file?.url;
  if (!maybeUrl) {
    return null;
  }

  return maybeUrl.startsWith('//') ? `https:${maybeUrl}` : maybeUrl;
}

function mapHeroSlideEntry(entry, index) {
  const fields = entry?.fields || {};
  const image = fields.image || fields.asset || fields.heroImage;

  return {
    title: fields.title || `Slide ${index + 1}`,
    imageUrl: mapAssetUrl(image),
    imageAlt: fields.imageAlt || fields.description || fields.title || 'Hosanna Church',
  };
}

function mapCardEntry(entry) {
  const fields = entry?.fields || {};

  return {
    title: fields.title || '',
    description: fields.description || '',
  };
}

function mapMinistryEntry(entry) {
  const fields = entry?.fields || {};

  return {
    title: fields.title || '',
    description: fields.description || '',
    imageUrl: mapAssetUrl(fields.image),
    slug: fields.slug || '',
  };
}

function mapServiceTimeEntry(entry) {
  const fields = entry?.fields || {};

  return {
    day: fields.day || '',
    time: fields.time || '',
    type: fields.type || '',
    location: fields.location || '',
    note: fields.note || '',
  };
}

function mapSectionEntry(entry) {
  const fields = entry?.fields || {};
  const contentTypeId = getContentTypeId(entry);
  const sectionType = fields.type || contentTypeId;
  const base = {
    id: entry?.sys?.id || null,
    title: fields.title || '',
    type: sectionType,
    settings: parseSettingsJson(fields.settingsJson),
  };

  if (contentTypeId === 'heroSection' || sectionType === 'hero') {
    return {
      ...base,
      welcome: fields.welcome || '',
      subtitle: fields.subtitle || '',
      buttonLabel: fields.buttonLabel || '',
      buttonUrl: fields.buttonUrl || '',
      heroSlides: resolveLinkList(fields.heroSlides, mapHeroSlideEntry),
    };
  }

  if (contentTypeId === 'aboutSection' || sectionType === 'about') {
    return {
      ...base,
      eyebrow: fields.eyebrow || '',
      description: fields.description || '',
      cards: resolveLinkList(fields.cards, mapCardEntry),
    };
  }

  if (contentTypeId === 'ministriesSection' || sectionType === 'ministries') {
    return {
      ...base,
      eyebrow: fields.eyebrow || '',
      description: fields.description || '',
      ministries: resolveLinkList(fields.ministries, mapMinistryEntry),
    };
  }

  if (contentTypeId === 'serviceTimesSection' || sectionType === 'serviceTimes') {
    return {
      ...base,
      eyebrow: fields.eyebrow || '',
      description: fields.description || '',
      serviceTimes: resolveLinkList(fields.serviceTimes, mapServiceTimeEntry),
    };
  }

  if (contentTypeId === 'livestreamSection' || sectionType === 'livestream') {
    return {
      ...base,
      description: fields.description || '',
      buttonLabel: fields.buttonLabel || '',
      buttonUrl: fields.buttonUrl || '',
    };
  }

  if (contentTypeId === 'ctaSection' || sectionType === 'cta') {
    return {
      ...base,
      description: fields.description || '',
      buttonLabel: fields.buttonLabel || '',
      buttonUrl: fields.buttonUrl || '',
    };
  }

  return base;
}

function mapPageEntry(entry) {
  const fields = entry?.fields || {};
  const sections = resolveLinkList(fields.sections, mapSectionEntry);

  const heroSection = sections.find((section) => section.type === 'hero');
  const aboutSection = sections.find((section) => section.type === 'about');
  const ministriesSection = sections.find((section) => section.type === 'ministries');
  const serviceTimesSection = sections.find((section) => section.type === 'serviceTimes');
  const livestreamSection = sections.find((section) => section.type === 'livestream');
  const ctaSection = sections.find((section) => section.type === 'cta');

  return {
    locale: entry?.sys?.locale || 'en-US',
    updatedAt: entry?.sys?.updatedAt || null,
    page: {
      title: fields.title || '',
      slug: fields.slug || '/',
      sections,
    },
    sections,
    hero: heroSection
      ? {
          welcome: heroSection.welcome || '',
          subtitle: heroSection.subtitle || '',
          ctaLabel: heroSection.buttonLabel || '',
          slides: heroSection.heroSlides || [],
        }
      : {
          welcome: '',
          subtitle: '',
          ctaLabel: '',
          slides: [],
        },
    about: aboutSection
      ? {
          eyebrow: aboutSection.eyebrow || '',
          title: aboutSection.title || '',
          description: aboutSection.description || '',
          cards: aboutSection.cards || [],
        }
      : {
          eyebrow: '',
          title: '',
          description: '',
          cards: [],
        },
    ministries: ministriesSection?.ministries || [],
    serviceTimes: serviceTimesSection?.serviceTimes || [],
    livestream: livestreamSection
      ? {
          title: livestreamSection.title || '',
          description: livestreamSection.description || '',
          buttonLabel: livestreamSection.buttonLabel || '',
          buttonUrl: livestreamSection.buttonUrl || '',
        }
      : null,
    cta: ctaSection
      ? {
          title: ctaSection.title || '',
          description: ctaSection.description || '',
          buttonLabel: ctaSection.buttonLabel || '',
          buttonUrl: ctaSection.buttonUrl || '',
        }
      : null,
  };
}

function mapLegacyHomeEntry(entry) {
  const fields = entry?.fields || {};
  const heroSlides = Array.isArray(fields.heroSlides)
    ? fields.heroSlides
        .map((slide, index) => ({
          title: slide?.fields?.title || `Slide ${index + 1}`,
          imageUrl: mapAssetUrl(slide),
          imageAlt: slide?.fields?.description || slide?.fields?.title || 'Hosanna Church',
        }))
        .filter((slide) => Boolean(slide.imageUrl))
    : [];

  const aboutCards = Array.isArray(fields.aboutCards)
    ? fields.aboutCards.map((card) => ({
        title: card?.fields?.title || '',
        description: card?.fields?.description || '',
      }))
    : [];

  return {
    locale: entry?.sys?.locale || 'en-US',
    updatedAt: entry?.sys?.updatedAt || null,
    page: {
      title: fields.internalName || 'Home',
      slug: '/',
      sections: [],
    },
    sections: [],
    hero: {
      welcome: fields.heroWelcome || '',
      subtitle: fields.heroSubtitle || '',
      ctaLabel: fields.heroCtaLabel || '',
      slides: heroSlides,
    },
    about: {
      eyebrow: fields.aboutEyebrow || '',
      title: fields.aboutTitle || '',
      description: fields.aboutDescription || '',
      cards: aboutCards,
    },
    ministries: [],
    serviceTimes: [],
    livestream: null,
    cta: null,
  };
}

async function fetchFirstEntry(client, contentType, locale, include) {
  const response = await client.getEntries({
    content_type: contentType,
    locale,
    limit: 1,
    include,
  });

  return response?.items?.[0] || null;
}

async function getHomePage({ locale = 'en-US', preview = false }) {
  if (!hasConfig()) {
    logger.warn('Contentful is not configured; serving fallback CMS content');
    return null;
  }

  const client = buildClient({ preview });
  if (!client) {
    return null;
  }

  const pageEntry = await fetchFirstEntry(client, PAGE_CONTENT_TYPE, locale, 5);
  if (pageEntry) {
    return mapPageEntry(pageEntry);
  }

  const legacyEntry = await fetchFirstEntry(client, LEGACY_HOME_PAGE_CONTENT_TYPE, locale, 2);
  if (legacyEntry) {
    return mapLegacyHomeEntry(legacyEntry);
  }

  return null;
}

module.exports = {
  getHomePage,
};
