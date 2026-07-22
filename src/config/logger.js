const pino = require('pino');
const environment = require('./environment');

const logger = pino({
  level: environment.isProduction ? 'info' : 'debug',
  ...(environment.isProduction
    ? {} // JSON output in production (Cloud Logging parses it)
    : { transport: { target: 'pino-pretty' } } // Pretty output locally
  ),
});

module.exports = logger;
