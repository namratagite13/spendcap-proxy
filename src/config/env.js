const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(8080),

    GEMINI_API_KEY: Joi.string().required().description('Master Google Gemini API key'),

    // Optional shared-secret gate. Unset = trusted/local mode (no auth check).
    // Set this before exposing the proxy on any shared or public network.
    PROXY_KEY: Joi.string().optional().description('Shared key required in X-API-Key header'),

    REDIS_URL: Joi.string().default('redis://localhost:6379'),

    DEFAULT_MONTHLY_BUDGET_USD: Joi.number().positive().default(10.00),
    SOFT_LIMIT_THRESHOLD_RATIO: Joi.number().min(0).max(1).default(0.50),

    USE_MOCK_GEMINI: Joi.boolean().default(false),
}).unknown();

const { value, error } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    NODE_ENV: value.NODE_ENV,
    PORT: value.PORT,
    REDIS_URL: value.REDIS_URL,
    GEMINI_API_KEY: value.GEMINI_API_KEY,
    PROXY_KEY: value.PROXY_KEY,
    DEFAULT_MONTHLY_BUDGET_USD: value.DEFAULT_MONTHLY_BUDGET_USD,
    SOFT_LIMIT_THRESHOLD_RATIO: value.SOFT_LIMIT_THRESHOLD_RATIO,
    USE_MOCK_GEMINI: value.USE_MOCK_GEMINI,
};

module.exports = { config };