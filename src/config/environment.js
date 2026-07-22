require('dotenv').config();

const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = environment;
