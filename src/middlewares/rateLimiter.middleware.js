

const rateLimit = require('express-rate-limit');

const { ipKeyGenerator } = require('express-rate-limit');

const { RedisStore } = require('rate-limit-redis');
const {  redisClient } = require('../config/redis.js');

const logger = require('../config/logger.js');

const createLimiter = ({windowMs, max, prefix}) =>{
   
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true,
        keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
        store : new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
            prefix
        }),
        handler: (req, res) =>{
            logger.warn(`rate limit exceeded for identifier ${req.ip}`, {
                path: req.originalUrl
            });

            res.status(429).json({
                success:false,
                error: 'Too many requests. please try again later'
            })
        }

    })
    
};

const globalRateLimiter = createLimiter({
    windowMs: 15*60*1000,
    max: 100,
    prefix: 'rl:global'
});


const strictRateLimiter = createLimiter({
    windowMs: 5*60*1000,
    max: 10,
    prefix: 'rl:strict'
});


module.exports = {
    globalRateLimiter,
    strictRateLimiter
}