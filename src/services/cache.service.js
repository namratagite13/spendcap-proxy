


const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const logger = require('../config/logger');
const { cacheHitsTotal } = require('../config/metrics');

const CACHE_TTL_SECONDS = 86400 //24 hr;
const CACHE_PREFIX = 'cache:prompt:' ;

const buildCacheKey = (prompt, modelName) =>{
    const normalized = prompt.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(`${modelName} : ${normalized}`).digest('hex');

    return `${CACHE_PREFIX}:${hash}`;
};

const getCachedResponse = async (prompt, modelName) =>{
    try{
        const key = buildCacheKey(prompt, modelName);
        const raw = await redisClient.get(key);
        if(!raw){
            logger.info('[Cache] MISS');
            cacheHitsTotal.inc({ status: 'miss' });
            return null;
            
        }
        logger.info(`[Cache] HIT`);
        cacheHitsTotal.inc({ status: 'hit' });
        return JSON.parse(raw)
      

    }catch(error){
        logger.error('[Cache] Error reading cache', {
            error: error.message
        });
        return null

    }
};

const setCachedResponse = async(prompt, modelName, responseText) =>{
    try{
        const key = buildCacheKey(prompt, modelName);
        const payload = JSON.stringify({
            text: responseText,
            model: modelName,
            cachedAt : new Date().toISOString()
        });
        await redisClient.set(key, payload, {EX: CACHE_TTL_SECONDS})

    }catch(error){
        logger.error('[Cache] failed to store response', {
            error: error.message
        });
        
    };
};

module.exports = {getCachedResponse, setCachedResponse}
