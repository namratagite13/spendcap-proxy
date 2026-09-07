




const request = require('supertest');
const app = require('../../src/app');

const { requireApiKey } = require('../../src/middlewares/auth.middleware');
const { validateGeneratePayload } = require('../../src/middlewares/validate.middleware');
const { strictRateLimiter, globalRateLimiter } = require('../../src/middlewares/rateLimiter.middleware');
const { checkSpendCap } = require('../../src/middlewares/spendCap.middleware');
const { handleGenerate } = require('../../src/controllers/gateway.controller');


jest.mock('../../src/middlewares/auth.middleware.js', () =>({
    requireApiKey: (req, res, next) => next()
}))

jest.mock('../../src/middlewares/validate.middleware.js', () =>({
    validateGeneratePayload: (req, res, next) => next()
}))

jest.mock('../../src/middlewares/rateLimiter.middleware.js', () =>({
    globalRateLimiter : (req, res, next) => next(),
    strictRateLimiter : (req, res, next) => next()
}))

jest.mock('../../src/middlewares/spendCap.middleware.js', () =>({
    checkSpendCap: (req, res, next) => next()
}))

jest.mock('../../src/controllers/gateway.controller.js', () => ({
    handleGenerate: (req, res) => res.status(200).json({success: true, text: 'mocked ai output'})
}))


describe('V1 API Routes Integration', () => {

   
    it('POST ai/generate should return success true and generated AI response', async() =>{
      
        const response = await request(app)
        .post('/v1/ai/generate') // Added /v1 prefix here
        .send({ prompt: 'Hello world' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
        success: true,
        text: 'mocked ai output'
        });
    })
})