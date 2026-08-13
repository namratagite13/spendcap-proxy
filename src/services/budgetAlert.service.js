

const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

const ALERT_SUPPRESSION_TTL_SECONDS = 86400; // once per 24 hours

const triggerSoftLimitAlert = async(userId, spendData) =>{

    try{
        const alertFlagKey = `user:alert_sent:${userId}`;

        //checking if already alerted
        const alreadyAlerted = await redisClient.get(alertFlagKey);
        if(alreadyAlerted) return;

        const {currentSpendUSD, maxBudgetUSD, percentUsed} = spendData;

        logger.warn(
            `[BudgetAlert] User ${userId} crossed soft budget limit! ` +
            `Used: ${percentUsed}% ($${currentSpendUSD.toFixed(2)} / $${maxBudgetUSD.toFixed(2)})`
        );

        // alert mechanism

        //setting a flag in redis so we only alert ones per 24 hours
        await redisClient.set(alertFlagKey, 'true', { EX: ALERT_SUPPRESSION_TTL_SECONDS || 86400 });
    }catch(error){
        logger.error(`[BudgetAlert] Failed to process alert for ${userId}`, {
            error: error.message,
            stack: error.stack
        })
    }
}

module.exports = {
    triggerSoftLimitAlert
}