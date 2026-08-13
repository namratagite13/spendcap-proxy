

const client = require('prom-client');


//creating custom registry
const register = new client.Registry();

//enabling node.js default metrics
client.collectDefaultMetrics({register});


/// --- http and gateway metrics ---

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',                       //The unique identifier for your metric in Prometheus.
    help: 'Total HTTP requests processed by gateway.', // A human-readable description of the metric.
    labelNames: ['method', 'route', 'status_code'] ,     //An array of metadata keys (dimensions or tags) that allow you to slice, filter, and aggregate your metric data.
    registers: [register]  //registers: [register] explicitly binds that metric to your custom const register = new client.Registry()
});

const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_requests_duration_seconds',
    help: 'HTTP requests duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register]
});


const cacheHitsTotal = new client.Counter({
    name: 'gateway_cache_hits_total',
    help: 'Total cache hits vs misses in gateway Redis cache.',
    labelNames: ['status'],
    registers: [register]
});


//--- LLM token and cost Tracking ---

const llmTokenUsageTotal = new client.Counter({
    name: 'llm_token_consumed_total',
    help: 'Total LLM token consumed',
    labelNames: ['model', 'token_type'], // token_type: 'prompt' | 'completion'
    registers: [register]
});

const llmEstimatedCostTotal = new client.Counter({
    name: 'llm_estimated_cost_usd_total',
    help: 'Total estimated cost in USD for llm requests',
    labelNames: ['model', 'provider'],
    registers: [register]
});








module.exports = {
    register,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    cacheHitsTotal,
    llmTokenUsageTotal,
    llmEstimatedCostTotal,

}

