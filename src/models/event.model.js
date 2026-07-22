const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
});

const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO 8601 datetime string' }),
  location: z.string().max(300).optional(),
  type: z.enum(['service', 'event', 'meeting', 'outreach']).default('event'),
  image: z.string().url().max(2000).optional(),
  price: z.string().max(50).optional(),
  includeHosannaMap: z.boolean().default(false),
  contacts: z.array(contactSchema).max(10).optional(),
});

const updateEventSchema = createEventSchema.partial();

module.exports = { createEventSchema, updateEventSchema };
