

const rateLimiter = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis')
const {redisClient, connectRedis} = require('../config/redis')
const logger = require('../config/logger');

const safeSendCommand = async (...args) =>{
    if(!redisClient.isOpen){
        await connectRedis();
    }

    return redisClient.sendCommand(args)
};

const keyGenerator = (req, res) =>{
    if(req.user?.id) return req.user.id;
    return rateLimiter.ipKeyGenerator(req, res);
};

const rateLimitHandler = (req, res) => {
    const identifier = keyGenerator(req, res);

    logger.warn(`Rate limit exceeded for ${identifier}` , {
        ip: req.ip,
        path: req.originalUrl
    });
    res.status(429).json({
        status: false,
        error: 'Too many requests. Please tru again later.'
    });
};

const buildRateLimiter = ({windowMs, max, prefix}) =>{
    return rateLimiter({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true, // avoid blocking app traffic if Redis goes down
        keyGenerator,
        store: new RedisStore({sendCommand: safeSendCommand, prefix}),
        handler: rateLimitHandler
    })
};

const globalRateLimiter = buildRateLimiter({
    windowMs: 15*60*1000,
    max: 100,
    prefix: 'rl:global'
});

const strictRateLimiter = buildRateLimiter({
    windowMs: 5*60*1000,
    max: 10,
    prefix: 'rl:strict'
});

module.exports = {
    globalRateLimiter,
    strictRateLimiter
}