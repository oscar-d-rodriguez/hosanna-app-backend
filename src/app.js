const express = require('express');
const cors = require('cors');
const defaultEnvironment = require('./config/environment');
const { errorHandler } = require('./middleware/error.middleware');
const apiLimiter = require('./middleware/rateLimiter.middleware');

function createApp({
  environment = defaultEnvironment,
  eventsRouter,
  contentRouter,
  allowedOrigins,
} = {}) {
  const app = express();
  const defaultAllowedOrigins = [
    'https://iglesiahosanna.com',
    'https://www.iglesiahosanna.com',
    'https://v0-church-website-design-dusky.vercel.app',
  ];

  const resolvedAllowedOrigins = allowedOrigins || (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultAllowedOrigins);

  if (!eventsRouter) {
    eventsRouter = require('./api/routes/events.routes');
  }

  if (!contentRouter) {
    contentRouter = require('./api/routes/content.routes');
  }

  app.set('trust proxy', environment.isProduction ? 1 : false);

  app.use(
    cors({
      origin: environment.isProduction
        ? (origin, callback) => {
            if (!origin || resolvedAllowedOrigins.includes(origin)) {
              return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
          }
        : true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10kb' }));
  app.use('/api', apiLimiter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/events', eventsRouter);
  app.use('/api/content', contentRouter);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
