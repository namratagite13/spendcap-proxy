
const logger = require('../config/logger');
const { genAI } = require('../config/gemini');
const { calculateTokenMetrics } = require('../utils/tokenCalculator');

const FALLBACK_MODEL = 'gemini-flash-lite-latest'; // cheap fallback — never escalate cost on failure

const generateFallbackResponse = async (prompt) => {
    try {
        logger.info(`[FallbackService] Executing fallback call on ${FALLBACK_MODEL}`);

        const response = await genAI.models.generateContent({
            model: FALLBACK_MODEL,
            contents: prompt,
        });

        const tokenMetrics = calculateTokenMetrics(response.usageMetadata, FALLBACK_MODEL);

        return {
            text: response.text,
            model: FALLBACK_MODEL,
            provider: `fallback (${FALLBACK_MODEL})`,
            isFallback: true,
            tokens: tokenMetrics,
        };
        } catch (error) {
        logger.error('[FallbackService] Fallback service failed', {
            error: error.message,
            stack: error.stack,
        });
        throw new Error('Both primary and fallback AI services are currently unavailable.');
    }
};

module.exports = { generateFallbackResponse };