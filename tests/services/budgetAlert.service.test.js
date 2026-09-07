const { config } = require("../../src/config/env");
const { redisClient } = require("../../src/config/redis");
const { triggerSoftLimitAlert, triggerHardLimitAlert } = require("../../src/services/budgetAlert.service");

const logger = require('../../src/config/logger.js')


jest.mock('../../src/config/redis.js', () =>({

    redisClient : {
        isOpen: true,
        connect: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue({alertFlagKey: 'dummy-key'}),
        set: jest.fn().mockResolvedValue('OK')
    }
}))

jest.mock('../../src/config/logger.js', () =>({

    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
}))

jest.mock('../../src/config/env.js', () =>({
    config:{
        ALERT_WEBHOOK_URL : 'dummy.com'
    }
}))




describe('BudgetAlert Service', () =>{


    beforeEach(() =>{
        jest.clearAllMocks();

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
        });

    })


    it('it should trigger soft limit alert when user hit soft limit set on max budget', async() =>{

        redisClient.get.mockResolvedValue(null);
        const userId  = 'dummy-user'
        const payload = {
            event: 'budget.hard_limit_crossed',
            userId : 'dummy-user',
            currentSpendUSD : 80,
            maxBudgetUSD: 100,
            percentUsed: 80,
            timestamp: new Date().toISOString(),
        }

        await triggerSoftLimitAlert(userId, payload);
        expect(logger.warn).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledWith('dummy.com', expect.any(Object))
        expect(redisClient.set).toHaveBeenCalled()
        

    })

    
    it('it should trigger HARD limit alert when user exceeded max budget set', async() =>{

        redisClient.get.mockResolvedValue(null);
        const userId  = 'dummy-user'
        const payload = {
            event: 'budget.hard_limit_crossed',
            userId : 'dummy-user',
            currentSpendUSD : 120,
            maxBudgetUSD: 100,
            percentUsed: 100,
            timestamp: new Date().toISOString(),
        }

        await triggerHardLimitAlert(userId, payload);
        expect(logger.warn).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledWith('dummy.com', expect.any(Object))
        expect(redisClient.set).toHaveBeenCalled()
        
        

    })


})