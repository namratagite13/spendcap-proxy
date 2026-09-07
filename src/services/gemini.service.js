

const retry = require('async-retry');

const { env } = require('../config/env');
const logger = require('../config/logger');
const { generateFallbackResponse } = require('../services/fallback.service');
const {llmEstimatedCostTotal, llmTokenUsageTotal} = require('../config/metrics');
const { calculateTokenMetrics } = require('../utils/tokenCalculator');
const { genAI } = require('../config/gemini');



const isRetryableError = (error) => {
    const status = error?.status || error?.response?.status;
    if (status === 429 || (status >= 500 && status < 600)) return true;
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET') return true;
    return false;
};

const generateGeminiResponse = async ({ prompt, modelName = 'gemini-flash-latest' }) => {
    
    //mock gemini trial
    if (process.env.USE_MOCK_GEMINI === 'true') {
        logger.info('[GeminiService] Using MOCK Gemini response (Local Test Mode)');
        
        const mockUsage = { promptTokenCount: 12, candidatesTokenCount: 25, totalTokenCount: 37 };
        const tokenMetrics = calculateTokenMetrics(mockUsage, modelName);

        // Record metrics even during mock mode so prom-client continues working
        llmTokenUsageTotal.inc({ model: modelName, token_type: 'prompt' }, tokenMetrics.promptToken || 12);
        llmTokenUsageTotal.inc({ model: modelName, token_type: 'completion' }, tokenMetrics.completionToken || 25);
        llmEstimatedCostTotal.inc({ model: modelName, provider: 'primary' }, tokenMetrics.estimatedCostUsd || 0.00005);

        return {
            text: `[MOCK RESPONSE]: Successfully processed prompt "${prompt.substring(0, 30)}..." through AI Guardrail Gateway.`,
            model: modelName,
            provider: `primary-mock (${modelName})`,
            isFallback: false,
            latencyMs: 45,
            tokens: tokenMetrics,
        };
    }


    try {
        const startTime = Date.now()
        const primaryResult = await retry(
            async (bail, attempt) => {
                try {
                    if (attempt > 1) {
                        logger.info(`[GeminiService] Retry attempt #${attempt} for Primary Model`);
                    }

                    const response = await genAI.models.generateContent({
                        model: modelName,
                        contents: prompt,
                    });

                    // Calculating and Record Token Metrics
                    const usage = response.usageMetadata || {};
                    
                    const tokenMetrics = calculateTokenMetrics(usage, modelName);

                    llmTokenUsageTotal.inc({model: modelName, token_type: 'prompt' }, tokenMetrics.promptToken|| 0);
                    llmTokenUsageTotal.inc({model: modelName, token_type: 'completion'}, tokenMetrics.completionToken || 0);
                    llmEstimatedCostTotal.inc({model: modelName, provider: 'primary'}, tokenMetrics.estimatedCostUsd || 0)

                    return {
                        text: response.text,
                        model: modelName,
                        provider: `primary (${modelName})`,
                        isFallback: false,
                        latencyMs: Date.now() - startTime,
                        tokens: tokenMetrics,
                    };
                } catch (error) {
                    if (!isRetryableError(error)) {
                        logger.warn('[GeminiService] Non-retryable error encountered. Bailing retries.', {
                            status: error?.status || error?.response?.status,
                            message: error.message,
                        });
                        bail(error);
                        return;
                    }
                    throw error;
                    
                }
            },
            {
                retries: 3,
                factor: 2,
                minTimeout: 1000,
                maxTimeout: 5000,
                randomize: true, //staggering retry times
                onRetry: (err, attempt) => {
                    logger.warn(`[GeminiService] Primary model attempt ${attempt} failed. Retrying...`, {
                        error: err.message,
                        attempt
                    });
                }
            }
        );

        return primaryResult;
    } catch (error) {
        logger.error('[Gemini Service] Execution failed after all retries', {
            error: error.message,
            stack: error.stack
        });

        return await generateFallbackResponse(prompt);
    }
};

module.exports = {
    generateGeminiResponse
};