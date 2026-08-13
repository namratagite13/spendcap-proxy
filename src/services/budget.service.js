


const { redisClient } = require('../config/redis');
const { config } = require('../config/env');

const logger = require('../config/logger');

const { getSoftLimitUSD } = require('../utils/budgetMath');


const trackExecutionSpend = async(userId, costMetrics) =>{
    try{
        const redisKey = `user:budget:${userId}`;
        logger.info(`[Budget Service] DEBUG using key: ${redisKey}`);
        const addedCost = costMetrics.estimatedCostUsd || 0;
        const addedTokens = costMetrics.totalTokenCount || 0;

        const rawData = await redisClient.get(redisKey);
        const maxBudgetUSD = config.DEFAULT_MONTHLY_BUDGET_USD;
        const softLimitUSD = getSoftLimitUSD(maxBudgetUSD, config.SOFT_LIMIT_THRESHOLD_RATIO);
        let budgetState = {
            currentSpendUSD: 0,
            currentDailyToken: 0,
            maxBudgetUSD,
            softLimitUSD,
            lastUpdated: new Date().toISOString()
        }
        if(rawData){
            budgetState = {...budgetState, ...JSON.parse(rawData)};
        }

        budgetState.currentSpendUSD = parseFloat((budgetState.currentSpendUSD + addedCost).toFixed(6));
        budgetState.currentDailyToken += addedTokens;
        budgetState.lastUpdated = new Date().toISOString();


        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() +1, 1);
        const ttlSeconds = Math.floor((endOfMonth.getTime()-now.getTime()) /1000);

        await redisClient.set(redisKey, JSON.stringify(budgetState), {EX: ttlSeconds});

        logger.info(`[Budget Service] Updated spend for user ${userId}`, {
            addedCost,
            newTotalUSD: budgetState.currentSpendUSD
        })

        return budgetState

    }catch(error){
        logger.error(`[Budget Service] Failed to track spend for user ${userId}`, {
            error: error.message,
            stack: error.stack
        });
        return null;
    }
};

module.exports = {
    trackExecutionSpend
}