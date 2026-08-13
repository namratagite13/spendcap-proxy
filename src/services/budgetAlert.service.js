const { redisClient } = require('../config/redis');
const { config } = require('../config/env');
const logger = require('../config/logger');

const ALERT_SUPPRESSION_TTL_SECONDS = 86400; // once per 24 hours
const WEBHOOK_TIMEOUT_MS = 5000;

const postWebhook = async (url, payload) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!res.ok) {
            logger.error(`[BudgetAlert] Webhook responded with ${res.status} ${res.statusText}`);
        }
    } catch (error) {
        logger.error(`[BudgetAlert] Webhook delivery failed: ${error.message}`);
    } finally {
        clearTimeout(timer);
    }
};

const triggerSoftLimitAlert = async (userId, spendData) => {
    try {
        const alertFlagKey = `user:alert_sent:${userId}`;
        const alreadyAlerted = await redisClient.get(alertFlagKey);
        if (alreadyAlerted) return;

        const { currentSpendUSD, maxBudgetUSD, percentUsed } = spendData;

        logger.warn(
            `[BudgetAlert] User ${userId} crossed soft budget limit! ` +
            `Used: ${percentUsed}% ($${currentSpendUSD.toFixed(2)} / $${maxBudgetUSD.toFixed(2)})`
        );

        if (config.ALERT_WEBHOOK_URL) {
            const payload = {
                event: 'budget.soft_limit_crossed',
                userId,
                currentSpendUSD,
                maxBudgetUSD,
                percentUsed,
                timestamp: new Date().toISOString(),
            };
            await postWebhook(config.ALERT_WEBHOOK_URL, payload);
        }

        await redisClient.set(alertFlagKey, 'true', { EX: ALERT_SUPPRESSION_TTL_SECONDS });
    } catch (error) {
        logger.error(`[BudgetAlert] Failed to process alert for ${userId}`, {
            error: error.message,
            stack: error.stack,
        });
    }
};

const triggerHardLimitAlert = async (userId, spendData) => {
    try {
        const alertFlagKey = `user:alert_sent:critical:${userId}`;
        const alreadyAlerted = await redisClient.get(alertFlagKey);
        if (alreadyAlerted) return;

        const { currentSpendUSD, maxBudgetUSD, percentUsed } = spendData;

        logger.warn(
            `[BudgetAlert] User ${userId} crossed HARD budget limit! ` +
            `Used: ${percentUsed}% ($${currentSpendUSD.toFixed(2)} / $${maxBudgetUSD.toFixed(2)})`
        );

        const webhookUrl = config.ALERT_WEBHOOK_URL_CRITICAL || config.ALERT_WEBHOOK_URL;
        if (webhookUrl) {
            const payload = {
                event: 'budget.hard_limit_crossed',
                userId,
                currentSpendUSD,
                maxBudgetUSD,
                percentUsed,
                timestamp: new Date().toISOString(),
            };
            await postWebhook(webhookUrl, payload);
        }

        await redisClient.set(alertFlagKey, 'true', { EX: ALERT_SUPPRESSION_TTL_SECONDS });
    } catch (error) {
        logger.error(`[BudgetAlert] Failed to process hard-limit alert for ${userId}`, {
            error: error.message,
            stack: error.stack,
        });
    }
};

module.exports = {
    triggerSoftLimitAlert,
    triggerHardLimitAlert,
};