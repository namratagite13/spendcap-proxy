
const { config } = require('../config/env');
const logger = require('../config/logger');

 
const requireApiKey = (req, res, next) =>{

    //key unset for devs *** please remove when your app is in production
    if (!config.PROXY_KEY){
        req.user = {id: 'local'};
        return next();

    }

    //key set single shared secret block random access
    const providedKey = req.headers['x-api-key'];
    if(providedKey !== config.PROXY_KEY) {
        logger.warn('[Access Control] Rejected request with missing/invalid key.');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Missing or invalid x-api-key header.'
        });
    } 
    req.user = {id: 'default'};
    next()

};


module.exports = {requireApiKey}