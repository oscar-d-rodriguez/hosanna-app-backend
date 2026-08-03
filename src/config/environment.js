require('dotenv').config();

const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  isProduction: process.env.NODE_ENV === 'production',
  contentful: {
    spaceId: process.env.CONTENTFUL_SPACE_ID || '',
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID || 'master',
    siteKey: process.env.CONTENTFUL_SITE_KEY || '',
    deliveryToken: process.env.CONTENTFUL_DELIVERY_TOKEN || '',
    previewToken: process.env.CONTENTFUL_PREVIEW_TOKEN || '',
    webhookSecret: process.env.CONTENTFUL_WEBHOOK_SECRET || '',
    previewKey: process.env.CMS_PREVIEW_KEY || '',
    requestTimeoutMs: parseInt(process.env.CONTENTFUL_REQUEST_TIMEOUT_MS || '8000', 10),
  },
  cmsCacheTtlSeconds: parseInt(process.env.CMS_CACHE_TTL_SECONDS || '300', 10),
  websiteRevalidateUrl: process.env.WEBSITE_REVALIDATE_URL || '',
};

module.exports = environment;
