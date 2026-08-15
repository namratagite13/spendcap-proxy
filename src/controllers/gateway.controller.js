

const {generateGeminiResponse} = require('../services/gemini.service');
const {getCachedResponse, setCachedResponse} = require('../services/cache.service');

const {triggerSoftLimitAlert} = require('../services/budgetAlert.service');

const {trackExecutionSpend} = require('../services/budget.service');
const logger = require('../config/logger');

const SOFT_LIMIT_WARNING = 'you have used {percent}% of your monthly spend budget';

//helpers

const tryCache = async(prompt, modelName) =>{
    const hit = await getCachedResponse(prompt, modelName);
    return hit;
};

const cacheInBackground = (prompt, modelName, text) =>{
    setCachedResponse(prompt, modelName, text).catch((error) =>{
        logger.error('[Gateway Controller] Cache write failed', {
            error: error.message
        });
    })
};

const recordSpend = (userId, tokens) =>{
    if(!userId) return null;
    return trackExecutionSpend(userId, tokens);
}

const buildSoftLimitWarning = (budget) =>{
    if(!budget || budget.currentSpendUSD < budget.softLimitUSD) return null;

    const percentUsed = Math.round((budget.currentSpendUSD /budget.maxBudgetUSD) * 100);
    return {
        message: SOFT_LIMIT_WARNING.replace('{percent}', percentUsed),
        currentSpendUSD: budget.currentSpendUSD,
        maxBudgetUSD: budget.maxBudgetUSD,
        percentUsed,
    }
};

const notifyIfWarning = (userId, warning) =>{
    if(!warning) return;

    triggerSoftLimitAlert(userId, warning).catch((err) =>{
        logger.error('[Gateway Controller] Failed to trigger soft limit alert.')
    });

};

const respondWithCacheHit = (res, hit, startTime) =>{

    return res.status(200).json({
        success: true,
        data: {
            text: hit.text,
            model: hit.model,
            cached: true,
            latencyMS : Date.now() -startTime
        }
    });

}

const respondWithFreshResults = (res, result, usage, warning, startTime) =>{
    return res.status(200).json({
        success: true,
        data: {
            text: result.text,
            model: result.model,
            cached: false,
            latencyMs: Date.now() - startTime
        },
        usage,
        warning,
    });
    
}

// controller


const handleGenerate = async(req, res, next) =>{

    const startTime = Date.now();

    try{
        const {prompt, modelName} = req.body;
        const cleanPrompt = prompt.trim();

        const cachedHit = await tryCache(cleanPrompt, modelName);
        if(cachedHit){
            return respondWithCacheHit(res, cachedHit, startTime)
        };

        const result = await generateGeminiResponse({prompt : cleanPrompt, modelName});
        cacheInBackground(cleanPrompt, modelName, result.text);

        const usage = result.tokens || {
            promptTokenCount : 0,
            candidateTokenCount: 0,
            totalTokenCount: 0,
            estimatedCostUsd: 0
        };

        const updateBudget = await recordSpend(req.user?.id, usage);
        logger.info(`[Gateway] DEBUG updateBudget=${JSON.stringify(updateBudget)}`);
        const warning = buildSoftLimitWarning(updateBudget);
        notifyIfWarning(req.user?.id, warning);

        return respondWithFreshResults(res, result, usage, warning, startTime)

    }catch(error){
        logger.error('[GateWay Controller] Error handling generation request', {
            error: error.message
        });
        next(error)
    }
};




module.exports = {handleGenerate}