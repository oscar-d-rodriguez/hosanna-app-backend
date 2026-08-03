const { Router } = require('express');
const cmsService = require('../../services/cms.service');
const environment = require('../../config/environment');
const { asyncHandler } = require('../../middleware/error.middleware');
const logger = require('../../config/logger');

const router = Router();

function parsePreviewFlag(value) {
  return value === '1' || value === 'true';
}

router.get(
  '/home',
  asyncHandler(async (req, res) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en-US';
    const preview = parsePreviewFlag(req.query.preview);

    // Preview requests require the backend preview key for safety.
    if (preview && req.headers['x-cms-preview-key'] !== environment.contentful.previewKey) {
      return res.status(401).json({ error: 'Invalid preview key' });
    }

    const data = await cmsService.getHomeContent({ locale, preview });
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

    cmsService.invalidateHomeContentCache();

    if (environment.websiteRevalidateUrl) {
      try {
        await fetch(environment.websiteRevalidateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hosanna-webhook-secret': environment.contentful.webhookSecret,
          },
          body: JSON.stringify({ source: 'contentful' }),
        });
      } catch (error) {
        logger.warn({ error }, 'Failed to notify website revalidation endpoint');
      }
    }

    return res.status(202).json({ status: 'accepted', message: 'CMS cache invalidated' });
  })
);

module.exports = router;
