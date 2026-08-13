
console.log('!!!!!!!!!!!! V1 ROUTES FILE LOADED !!!!!!!!!!!!');

const express = require('express');
const router = express.Router()


const { getMetrics } = require('../controllers/metrics.controller');
const { handleGenerate } = require('../controllers/gateway.controller');
const { requireApiKey } = require('../middlewares/auth.middleware');
const { strictRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { validateGeneratePayload } = require('../middlewares/validate.middleware');
const { checkSpendCap } = require('../middlewares/spendCap.middleware');


// --- Prometheus scrape route ---
router.get('/metrics', getMetrics);

// Pipeline sequence:
// 1. Access control — shared API key check
// 2. Validate Joi payload schema & char limits
// 3. Sliding-window rate limiter (per user/IP)
// 4. Budget & spend cap check (hard stop / soft-limit warning)
// 5. Controller: cache check -> Gemini call -> track spend -> respond
router.post(
    '/ai/generate',
    requireApiKey,
    validateGeneratePayload,
    strictRateLimiter,
    checkSpendCap,
    handleGenerate
);

module.exports = router;

