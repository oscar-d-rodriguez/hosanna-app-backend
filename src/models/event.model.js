const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
});

const eventSchemaFields = {
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
  endDate: z
    .string()
    .datetime({ message: 'End date must be a valid ISO 8601 datetime string' })
    .optional(),
  location: z.string().max(300).optional(),
  type: z
    .enum(['service', 'womens', 'mens', 'fundraiser', 'event', 'outreach', 'meeting'])
    .default('event'),
  image: z.string().url().max(2000).optional(),
  price: z.string().max(50).optional(),
  includeHosannaMap: z.boolean().default(false),
  contacts: z.array(contactSchema).max(10).optional(),
};

const validateDateRange = (event, ctx) => {
  if (!event.endDate) return;
  if (!event.date) return;

  const start = Date.parse(event.date);
  const end = Date.parse(event.endDate);

  if (Number.isNaN(start) || Number.isNaN(end)) return;

  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be equal to or after start date',
      path: ['endDate'],
    });
  }
};

const createEventSchema = z.object(eventSchemaFields).superRefine(validateDateRange);

const updateEventSchema = z.object(eventSchemaFields).partial().superRefine(validateDateRange);

module.exports = { createEventSchema, updateEventSchema };
