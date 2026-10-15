const { Router } = require('express');
const { z } = require('zod');
const { asyncHandler, AppError } = require('../../middleware/error.middleware');

const updateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(3000),
  author: z.string().trim().min(1).max(120),
}).strict();

function createUpdatesRouter({ db, authenticate, now = () => new Date() } = {}) {
  db ||= require('../../config/firebase').db;
  authenticate ||= require('../../middleware/auth.middleware');
  const router = Router();
  const collection = () => db.collection('updates');
  router.get('/', asyncHandler(async (req, res) => {
    const parsed = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      startAfter: z.string().regex(/^[A-Za-z0-9_-]+$/).optional(),
    }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid pagination parameters' });
    let query = collection().orderBy('publishedAt', 'desc').orderBy('__name__', 'desc').limit(parsed.data.limit);
    if (parsed.data.startAfter) {
      const cursor = await collection().doc(parsed.data.startAfter).get();
      if (!cursor.exists) throw new AppError('Update cursor not found', 400);
      query = query.startAfter(cursor);
    }
    const snapshot = await query.get();
    res.json(snapshot.docs.map(doc => {
      const { title, message, author, publishedAt } = doc.data();
      return { id: doc.id, title, message, author, publishedAt };
    }));
  }));
  router.post('/', authenticate, asyncHandler(async (req, res) => {
    if (!['admin', 'editor'].includes(req.user.role)) throw new AppError('Only admins and editors can publish updates', 403);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Title, message and author are required and must fit their length limits.' });
    const data = { ...parsed.data, publishedAt: now().toISOString() };
    const doc = await collection().add({ ...data, createdBy: req.user.uid });
    res.status(201).json({ id: doc.id, ...data });
  }));
  return router;
}
module.exports = { createUpdatesRouter };
