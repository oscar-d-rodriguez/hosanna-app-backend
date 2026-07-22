const express = require('express');
const cors = require('cors');
const environment = require('./config/environment');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/error.middleware');
const apiLimiter = require('./middleware/rateLimiter.middleware');
const eventsRouter = require('./api/routes/events.routes');

const app = express();

// Trust only one upstream proxy in production (Cloud Run), none in local dev.
// Using `true` is too permissive and is blocked by express-rate-limit.
app.set('trust proxy', environment.isProduction ? 1 : false);

// CORS — restrict origins in production
app.use(
  cors({
    origin: environment.isProduction
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : '*',
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

// Error handling (must be registered LAST)
app.use(errorHandler);

// Start server
app.listen(environment.port, () => {
  logger.info({ port: environment.port, env: environment.nodeEnv }, 'Server started');
});
