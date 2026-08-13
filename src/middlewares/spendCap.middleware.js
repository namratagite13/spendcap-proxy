


const { redisClient } = require('../config/redis');
const { config } = require('../config/env');
const {triggerHardLimitAlert} = require('../services/budgetAlert.service')
const logger = require('../config/logger');
const { getSoftLimitUSD, getPercentUSD } = require('../utils/budgetMath');

const checkSpendCap = async (req, res, next ) =>{
    try{
        const userId = req.user?.id || req.ip;
        const redisKey = `user:budget:${userId}`;

        const userBudgetRaw = await redisClient.get(redisKey);
        req.userBudgetKey = redisKey;

        if(!userBudgetRaw){
            //no spend recorded yet 
            return next()
        }

        logger.info(`[SpendCap] DEBUG userBudgetRaw: ${userBudgetRaw}`);

        const { currentSpendUSD = 0 } = JSON.parse(userBudgetRaw);
        const maxBudgetUSD = config.DEFAULT_MONTHLY_BUDGET_USD;
        const softLimitUSD = getSoftLimitUSD(maxBudgetUSD, config.SOFT_LIMIT_THRESHOLD_RATIO);


        if(currentSpendUSD >= maxBudgetUSD){
            logger.warn(`[SpendCap] Hard stop triggered for user ${userId}`, {
                currentSpendUSD,
                maxBudgetUSD,
            });
            triggerHardLimitAlert(userId, { currentSpendUSD, maxBudgetUSD, percentUsed: 100 }).catch((err) =>
                logger.error('[SpendCap] Failed to trigger hard limit alert', { error: err.message })
            );
            return res.status(402).json({
                success: false,
                error: 'Monthly budget cap exceeded',
                message: `Your account has reached its monthly spend limit of $${maxBudgetUSD.toFixed(2)}`,
                code: 'MONTHLY_BUDGET_EXCEEDED',
            });
        }


        if(currentSpendUSD >= softLimitUSD){
            const percentUsed = getPercentUSD(currentSpendUSD, maxBudgetUSD);

            req.budgetWarning = {
                isNearLimit: true,
                percentUsed,
                currentSpendUSD,
                maxBudgetUSD,
            };
            res.setHeader('X-Budget-Warning', `Account has used ${percentUsed}% of monthly limit`);
        }
        next()
    }catch(error){
        logger.error('[SpendCap] Error verifying spend cap', {
            error: error.message,
            stack: error.stack,
        });
        next(error);
    }
};

module.exports = {
    checkSpendCap
}

