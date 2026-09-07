const { cacheHitsTotal } = require("../../src/config/metrics");
const { redisClient } = require("../../src/config/redis");
const { getCachedResponse, setCachedResponse } = require("../../src/services/cache.service");

const logger = require('../../src/config/logger.js')




jest.mock('../../src/config/redis.js', () =>({

    redisClient : {
        isOpen: true,
        connect: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue(),
        set: jest.fn().mockResolvedValue('OK')
    }
}))


jest.mock('../../src/config/logger.js', () =>({

    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
}))

jest.mock('../../src/config/metrics.js', () =>({
    cacheHitsTotal: {
        inc : jest.fn()
    }
}))


describe('Cache Service', (() =>{


    beforeEach(() =>{

        

    });


    it('it increment cache hit and pass logger info message', async() =>{


        const prompt = 'some-prompt';
        const modelName = 'gemini-model'

        const cachedData = {response: 'cached-response'}

        redisClient.get.mockResolvedValue(JSON.stringify(cachedData))
        
        const result = await getCachedResponse(prompt, modelName)
        
        expect(logger.info).toHaveBeenCalledWith('[Cache] HIT')
        expect(cacheHitsTotal.inc).toHaveBeenCalledWith({
            status: 'hit'
        })
        expect(result).toEqual(cachedData)
           
    });
    it('it increment cache miss and pass logger info message', async() =>{


        const prompt = 'some-prompt';
        const modelName = 'gemini-model'

       // const cachedData = {response: 'cached-response'}

        redisClient.get.mockResolvedValue(null)
        
        const result = await getCachedResponse(prompt, modelName)
        
        expect(logger.info).toHaveBeenCalledWith('[Cache] MISS')
        expect(cacheHitsTotal.inc).toHaveBeenCalledWith({
            status: 'miss'
        })
        expect(result).toBeNull()
           
    })


    it('it should set cache key if users response encountered for first time after window renewed', async() =>{

    
        const prompt = 'some-prompt'
        const responseText = 'some-text'
        const modelName = 'gemini-model'

        redisClient.set.mockResolvedValue(true)

        await setCachedResponse(prompt, modelName, responseText);
        expect(redisClient.set).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining(responseText, modelName),
            expect.any(Object)
        )

    })


}))
