const { createClient: defaultCreateClient } = require('contentful');
const defaultEnvironment = require('../config/environment');
const defaultLogger = require('../config/logger');

const SITE_CONFIGURATION_CONTENT_TYPE = 'siteConfiguration';
const SUPPORTED_LOCALES = new Set(['en-US', 'es']);

function mapAssetUrl(asset) {
  const maybeUrl = asset?.fields?.file?.url;
  if (!maybeUrl) {
    return null;
  }

  return maybeUrl.startsWith('//') ? `https:${maybeUrl}` : maybeUrl;
}

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

function createContentfulService({
  createClient = defaultCreateClient,
  environment = defaultEnvironment,
  logger = defaultLogger,
} = {}) {
  function hasConfig() {
    const cfg = environment.contentful;
    return Boolean(cfg.spaceId && cfg.environmentId && cfg.deliveryToken && cfg.siteKey);
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

  function normalizeAsset(asset) {
    const fields = asset?.fields || {};
    const file = fields.file || {};
    const details = file.details || {};
    const imageDetails = details.image || {};
    const url = mapAssetUrl(asset);

    if (!url) {
      return null;
    }

    return {
      url,
      title: fields.title || '',
      description: normalizeOptionalText(fields.description),
      width: imageDetails.width || null,
      height: imageDetails.height || null,
      contentType: file.contentType || '',
    };
  }

  function normalizeSeoMetadata(entry) {
    const fields = entry?.fields || {};
    const pageTitle = fields.pageTitle || '';
    const description = fields.description || '';

    return {
      pageTitle,
      description,
      socialTitle: normalizeOptionalText(fields.socialTitle) || pageTitle,
      socialDescription: normalizeOptionalText(fields.socialDescription) || description,
      socialImage: normalizeAsset(fields.socialImage),
      hideFromSearchEngines: Boolean(fields.hideFromSearchEngines),
    };
  }

  function normalizeSiteConfiguration(entry) {
    const fields = entry?.fields || {};
    const siteConfiguration = {
      internalName: fields.internalName || '',
      siteKey: fields.siteKey || '',
      organizationName: fields.organizationName || '',
      organizationLogo: normalizeAsset(fields.organizationLogo),
      defaultSeoMetadata: normalizeSeoMetadata(fields.defaultSeoMetadata),
    };

    const organizationDescription = normalizeOptionalText(fields.organizationDescription);
    if (organizationDescription) {
      siteConfiguration.organizationDescription = organizationDescription;
    }

    return siteConfiguration;
  }

  async function getSiteConfiguration({ locale = 'en-US', preview = false } = {}) {
    if (!SUPPORTED_LOCALES.has(locale)) {
      return null;
    }

    if (!hasConfig()) {
      logger.warn('Contentful is not configured; site configuration is unavailable');
      return null;
    }

    const client = buildClient({ preview });
    if (!client) {
      return null;
    }

    const response = await client.getEntries({
      content_type: SITE_CONFIGURATION_CONTENT_TYPE,
      'fields.siteKey': environment.contentful.siteKey,
      locale,
      include: 2,
      limit: 1,
    });

    const entry = response?.items?.[0] || null;
    return entry ? normalizeSiteConfiguration(entry) : null;
  }

  return {
    getSiteConfiguration,
    mapAsset: mapAssetUrl,
    normalizeAsset,
    normalizeSeoMetadata,
    normalizeSiteConfiguration,
  };
}

const defaultService = createContentfulService();

module.exports = {
  createContentfulService,
  ...defaultService,
};
