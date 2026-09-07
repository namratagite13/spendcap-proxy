


const crypto = require('crypto');
const logger = require('../config/logger');

const defaultCodeForStatus = (status) => {
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 402) return 'PAYMENT_REQUIRED';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    return 'BAD_REQUEST';
};



const errorHandler = (err, req, res, next) =>{
    const correlationId = req.headers['x-correlation-id'] || req.correlationId || crypto.randomUUID();

    res.setHeader('x-correlation-id', correlationId);

    let statusCode = err.statusCode || err.status || 500;

    const responseBody = {
        success: false,
        error:{
            message: 'An unexpected internal error occurred',
            code: 'INTERNAL_SERVER_ERROR',
            correlationId
        }
    };

    //checking if error comes from joi
    if(err.isJoi){
        statusCode = 400;
        const formattedErrors = err.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, '') // clean up quotes in messages
        }))

        responseBody.error = {
            message: 'Invalid request payload',
            code: 'VALIDATION ERROR',
            details: formattedErrors,
            correlationId
        }
    }else if( statusCode < 500){
        responseBody.error = {
            message: err.message,
            code: err.code || defaultCodeForStatus(statusCode),
            correlationId
        }
    };

    if(statusCode >= 500){
        logger.error(`[ErrorHandler] ${err.message}`, {
            correlationId,
            path: req.originalUrl,
            stack: err.stack,
        })
    }else{
        logger.warn(`[ErrorHandler] ${responseBody.error.message}`, {
            correlationId,
        })
    };

    res.status(statusCode).json(responseBody)

}

module.exports = {errorHandler}
