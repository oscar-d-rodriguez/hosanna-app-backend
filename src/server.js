const express = require('express');
const cors = require('cors');
const environment = require('./config/environment');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/error.middleware');
const apiLimiter = require('./middleware/rateLimiter.middleware');
const eventsRouter = require('./api/routes/events.routes');
const contentRouter = require('./api/routes/content.routes');

const app = express();

const defaultAllowedOrigins = [
  'https://iglesiahosanna.com',
  'https://www.iglesiahosanna.com',
  'https://v0-church-website-design-dusky.vercel.app',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;

// Trust only one upstream proxy in production (Cloud Run), none in local dev.
// Using `true` is too permissive and is blocked by express-rate-limit.
app.set('trust proxy', environment.isProduction ? 1 : false);

// CORS — restrict origins in production
app.use(
  cors({
    origin: environment.isProduction
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rate limiting on all API routes
app.use('/api', apiLimiter);

// Health check — Cloud Run uses this to know your service is ready
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/events', eventsRouter);
app.use('/api/content', contentRouter);

// Error handling (must be registered LAST)
app.use(errorHandler);

// Start server
app.listen(environment.port, () => {
  logger.info({ port: environment.port, env: environment.nodeEnv }, 'Server started');
});
