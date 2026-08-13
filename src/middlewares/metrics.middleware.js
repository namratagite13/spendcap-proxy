
// Create a global Express middleware that automatically tracks total HTTP requests and request duration across all endpoints.
//We use res.on('finish', ...) for HTTP duration because HTTP request latency can only be calculated after the entire response cycle completes, whereas guardrailCheckDurationSeconds measures an isolated, synchronous or asynchronous internal function that finishes long before the HTTP response is sent.
//Because the middleware executes at t = 0, but the response finishes at t = 200ms, res.on('finish') acts as a callback listener that triggers when Node.js finishes writing the response bytes to the network socket.


const {httpRequestsTotal, httpRequestDurationSeconds} = require('../config/metrics');


const metricsMiddleware = (req, res, next) =>{

    //start histogram timer
    const endTimer = httpRequestDurationSeconds.startTimer();

    res.on('finish', () =>{             //acts as a callback listener that triggers when Node.js finishes writing the response bytes to the network socket.
        //resolve route path
        // 1. Gather all accurate, final metadata
        const route = req.route ? req.route.path : req.path;
        const labels = {
            method: req. method,
            route: route,
            status_code: res.statusCode.toString()
        }

        //increment request counter and record duration with final status_code
        httpRequestsTotal.inc(labels); // By waiting for res.on('finish'), the route handler has completed, and res.statusCode reflects the actual final outcome (200, 400, 429, 500, etc.).
        // 3. Record the total elapsed time for this request into histogram buckets
        endTimer(labels)
    });
    next()
};

module.exports = metricsMiddleware