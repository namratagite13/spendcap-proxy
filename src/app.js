const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const metricsMiddleware = require('./middlewares/metrics.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const { globalRateLimiter } = require('./middlewares/rateLimiter.middleware');
const v1Routes = require('./routes/v1.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(metricsMiddleware);

app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() }));
app.use('/v1', globalRateLimiter, v1Routes);
app.use(errorHandler);

module.exports = app;