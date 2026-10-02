const { createApp } = require('./app');
const environment = require('./config/environment');
const logger = require('./config/logger');
const app = createApp({ environment });

// Start server
app.listen(environment.port, () => {
  logger.info({ port: environment.port, env: environment.nodeEnv }, 'Server started');
});

module.exports = app;
