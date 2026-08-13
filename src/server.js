require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan')

const { redisClient, connectRedis } = require('./config/redis');
const { config } = require('./config/env');
const logger = require('./config/logger');

const metricsMiddleware = require('./middlewares/metrics.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const { globalRateLimiter } = require('./middlewares/rateLimiter.middleware');
const v1Routes = require('./routes/v1.routes');

async function startServer() {
  try {
    await connectRedis();

    if (!redisClient.isOpen) {
      throw new Error('Redis connection could not be established — refusing to start without it.');
    }

    const app = express();

    // Security & core middleware
    app.use(helmet());
    app.use(cors());
    app.use(morgan('dev'))

    // Parsers & global metrics
    app.use(express.json({ limit: '10kb' }));
    app.use(metricsMiddleware);

    // Health endpoint — intentionally unauthenticated, no rate limit (for load balancer checks)
    app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() }));

    // Rate-limited API routes
    app.use('/v1', globalRateLimiter, v1Routes);

    // Centralized error handler — must be last
    app.use(errorHandler);

    const PORT = config.PORT;
    const server = app.listen(PORT, () => {
      logger.info(`Gateway server listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server and Redis connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Startup failure:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();