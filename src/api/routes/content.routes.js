const { Router } = require('express');
const defaultCmsService = require('../../services/cms.service');
const defaultEnvironment = require('../../config/environment');
const { asyncHandler } = require('../../middleware/error.middleware');

function createContentRouter({
  cmsService = defaultCmsService,
  environment = defaultEnvironment,
} = {}) {
  const router = Router();
  const SUPPORTED_LOCALES = new Set(['en-US', 'es']);

  function parsePreviewFlag(value) {
    return value === '1' || value === 'true';
  }

  router.get(
    '/pages/home',
    asyncHandler(async (req, res) => {
      const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en-US';
      const preview = parsePreviewFlag(req.query.preview);

      if (!SUPPORTED_LOCALES.has(locale)) {
        return res.status(400).json({ error: 'Unsupported locale' });
      }

      if (preview && (!environment.contentful.previewKey || !environment.contentful.previewToken)) {
        return res.status(503).json({
          error: 'Preview mode is unavailable because CMS_PREVIEW_KEY or CONTENTFUL_PREVIEW_TOKEN is not configured',
        });
      }

      if (preview && req.headers['x-cms-preview-key'] !== environment.contentful.previewKey) {
        return res.status(401).json({ error: 'Invalid preview key' });
      }

      const data = await cmsService.getHomePage({ locale, preview });
      return res.json(data);
    })
  );

  router.get(
    '/site-configuration',
    asyncHandler(async (req, res) => {
      const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en-US';
      const preview = parsePreviewFlag(req.query.preview);

      if (!SUPPORTED_LOCALES.has(locale)) {
        return res.status(400).json({ error: 'Unsupported locale' });
      }

      if (preview && (!environment.contentful.previewKey || !environment.contentful.previewToken)) {
        return res.status(503).json({
          error: 'Preview mode is unavailable because CMS_PREVIEW_KEY or CONTENTFUL_PREVIEW_TOKEN is not configured',
        });
      }

      if (preview && req.headers['x-cms-preview-key'] !== environment.contentful.previewKey) {
        return res.status(401).json({ error: 'Invalid preview key' });
      }

      const data = await cmsService.getSiteConfiguration({ locale, preview });
      return res.json(data);
    })
  );

  router.get(
    '/ministries/:slug',
    asyncHandler(async (req, res) => {
      const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en-US';
      const preview = parsePreviewFlag(req.query.preview);

      if (!SUPPORTED_LOCALES.has(locale)) {
        return res.status(400).json({ error: 'Unsupported locale' });
      }

      if (preview && (!environment.contentful.previewKey || !environment.contentful.previewToken)) {
        return res.status(503).json({
          error: 'Preview mode is unavailable because CMS_PREVIEW_KEY or CONTENTFUL_PREVIEW_TOKEN is not configured',
        });
      }

      if (preview && req.headers['x-cms-preview-key'] !== environment.contentful.previewKey) {
        return res.status(401).json({ error: 'Invalid preview key' });
      }

      const data = await cmsService.getMinistry({ slug: req.params.slug, locale, preview });
      return res.json(data);
    })
  );

  router.post(
    '/webhook/contentful',
    asyncHandler(async (req, res) => {
      const receivedSecret = req.headers['x-hosanna-webhook-secret'];

      if (!environment.contentful.webhookSecret || receivedSecret !== environment.contentful.webhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }

      cmsService.invalidateCmsCache();

      return res.status(202).json({ status: 'accepted', message: 'CMS cache invalidated' });
    })
  );

  return router;
}

const defaultRouter = createContentRouter();

module.exports = defaultRouter;
module.exports.createContentRouter = createContentRouter;
