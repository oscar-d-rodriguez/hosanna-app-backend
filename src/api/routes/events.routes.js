const { Router } = require('express');
const eventService = require('../../services/event.service');
const { createEventSchema, updateEventSchema } = require('../../models/event.model');
const authMiddleware = require('../../middleware/auth.middleware');
const { asyncHandler } = require('../../middleware/error.middleware');

const router = Router();

// Public read routes for website integrations
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, startAfter } = req.query;
    const events = await eventService.list({
      limit: limit ? parseInt(limit, 10) : undefined,
      startAfter,
    });
    res.json(events);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await eventService.getById(req.params.id);
    res.json(event);
  })
);

// Protected write routes for app/admin users
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = createEventSchema.parse(req.body);
    const event = await eventService.create(data, req.user);
    res.status(201).json(event);
  })
);

router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = updateEventSchema.parse(req.body);
    const event = await eventService.update(req.params.id, data, req.user);
    res.json(event);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await eventService.delete(req.params.id, req.user);
    res.status(204).send();
  })
);

module.exports = router;
