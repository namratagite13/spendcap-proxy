

const logger = require('./logger');
const {createClient} = require('redis');
const {config} = require('./env')

const redisClient = createClient({
    url: config.REDIS_URL,
    RESP: 2,
    socket: {
        reconnectStrategy : (retries) =>{

            if(retries > 10) {
                logger.error('Redis Max reconnection attempts reached. Stopping reconnect.')
                return new Error('Redis connection failed')
            }
            const delay = Math.min(retries * 100 , 3000);
            logger.warn(`Redis client attempting reconnect in ${delay}ms... (Attempt ${retries})`)
            return delay 
        }
    }
})


redisClient.on('connect', () =>{
    logger.info('Redis client connecting to server')
});

redisClient.on('ready', () => {
    logger.info('Redis connection established and ready to accept commands')
});

redisClient.on('error', (err) =>{
    logger.error('Redis client connection error', {
        error: err.message,
        stack: err.stack
    })
});

// redisClient.on('end', () =>{
//     logger.warn('Redis connection closed')
// });


const connectRedis = async () =>{
    if(!redisClient.isOpen) {
        try{
            await redisClient.connect();
        }catch(error){
            logger.error('Initial connection failure during server startup', {
                error: error.message
            })
        }
    }
}


module.exports = {
    redisClient,
    connectRedis
}