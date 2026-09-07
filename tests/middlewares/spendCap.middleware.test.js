


const { checkSpendCap } = require("../../src/middlewares/spendCap.middleware.js");
const logger = require('../../src/config/logger.js');
const {config} = require('../../src/config/env.js');

const {redisClient} = require('../../src/config/redis.js');
const { getSoftLimitUSD, getPercentUSD } = require("../../src/utils/budgetMath.js");

jest.mock('../../src/config/logger.js', () => ({
   
    warn: jest.fn(),
    error: jest.fn(), // Make sure error is included here
    info: jest.fn()
    
}))

jest.mock('../../src/utils/budgetMath.js', () =>({
    getSoftLimitUSD: jest.fn().mockReturnValue(80),
    getPercentUSD: jest.fn().mockReturnValue(80)
}))

jest.mock('../../src/config/env.js', () =>({

    config: {
        DEFAULT_MONTHLY_BUDGET_USD : 100,
        SOFT_LIMIT_THRESHOLD_RATIO : 0.5
        
    }  
}))

jest.mock('../../src/config/redis.js', () => ({
    redisClient: {
        isOpen: true,
        connect: jest.fn().mockResolvedValue(),
        sendCommand: jest.fn().mockReturnValue(150),
        get: jest.fn()
    }
}))


describe('SpendCap', () =>{

    //declaring variable here so they are globally available
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() =>{

        jest.clearAllMocks()
        mockReq = {
            headers: {},
            user: {
                id: 'dummy-123'
            },
            
        };
        mockRes = {
            setHeader: jest.fn().mockReturnThis(),
            status : jest.fn().mockReturnThis(),
            json : jest.fn()
        };
        
        mockNext =  jest.fn()
    })

    it('it should throw Hard Stop triggered error when user exceed hard limit set on token usage', async() =>{

        // const getKeySpy = jest.spyOn(redisClient, 'get').mockReturnValue({})

        // const userBudgetRaw = getKeySpy
        // let eleSpy = jest.spyOn(redisClient, 'userBudgetRaw').mockReturnValue({currentSpendUSD : 150})

   
        const maxBudgetUSD = config.DEFAULT_MONTHLY_BUDGET_USD 
       
        const currentSpendUSD = 150
        redisClient.get.mockResolvedValue(JSON.stringify({ currentSpendUSD }));
        await checkSpendCap(mockReq, mockRes, mockNext)
        expect(logger.warn).toHaveBeenCalled()
   
        expect(mockRes.status).toHaveBeenCalledWith(402)
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Monthly budget cap exceeded',
            message: `This request was blocked. Your account has reached its monthly spend limit of $${maxBudgetUSD.toFixed(2)} — no further requests will be processed until your budget resets or is increased.`,
            code: 'MONTHLY_BUDGET_EXCEEDED',
            currentSpendUSD,
            maxBudgetUSD,
        })
        expect(mockNext).not.toHaveBeenCalled()
    })


    it('it should return alert message and call next function when user hit soft limit set', async() =>{

        const currentSpendUSD = 80
        const percentUsed = 80
          
        const maxBudgetUSD = config.DEFAULT_MONTHLY_BUDGET_USD 
        redisClient.get.mockResolvedValue(JSON.stringify({ currentSpendUSD }));
        await checkSpendCap(mockReq, mockRes, mockNext)
        expect(mockReq.budgetWarning).toEqual({
            isNearLimit: true,
            percentUsed,
            currentSpendUSD,
            maxBudgetUSD,
        })
        expect(mockRes.setHeader).toHaveBeenCalledWith(
            'X-Budget-Warning', `Account has used ${percentUsed}% of monthly limit`
        )
        expect(mockNext).toHaveBeenCalled()
    })

})