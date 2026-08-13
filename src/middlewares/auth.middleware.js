
const { config } = require('../config/env');
const logger = require('../config/logger');

 
const requireApiKey = (req, res, next) =>{
    //key unset for devs
    if (!config.PROXY_KEY){
        req.user = {id: 'local'};
        return next();

    }

    //key set single shred secret block randoms
    const providedKey = req.headers['x-api-key'];
    if(providedKey !== config.PROXY_KEY) {
        logger.warn('[Access Control] Rejected request with missing/invalid');
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Missing or invalid X-APi_key header.'
        });
    } 
    req.user = {id: 'default'}  ;
    next()

};


module.exports = {requireApiKey}