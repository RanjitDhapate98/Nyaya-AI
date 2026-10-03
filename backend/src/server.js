const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const app = require('./app');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    logger.error('Check MONGODB_URI in backend/.env');
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`NyayaAI API listening on http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
    logger.info(`ML service: ${env.ML_SERVICE_URL} | Gemini: ${env.geminiEnabled ? 'enabled' : 'disabled (template fallback)'}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error(`Unhandled rejection: ${reason?.stack || reason}`));
}

start();
