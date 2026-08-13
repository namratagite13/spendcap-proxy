
const winston = require('winston');
const { config } = require('../config/env');

const logger = winston.createLogger({
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
    defaultMeta:{
        service: 'spendcap-proxy',
        environment: process.env.NODE_ENV,
        
    },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack:true}),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
           format: process.env.NODE_ENV === 'development' ? 
           winston.format.combine(
           winston.format.colorize(),
            winston.format.printf(
                ({timestamp, level, message, stack}) => 
                `[${timestamp}] ${level} : ${stack || message}`

            )
        )
           : winston.format.json()
        }),
        new winston.transports.File({ filename: 'app.log' }),
        // new winston.transports.Console(),
        // Save all logs to app.log and errors to error.log
        new winston.transports.File({ filename: 'app.log' }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        
    ]
})


module.exports = logger
