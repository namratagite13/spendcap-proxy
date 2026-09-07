const { globalRateLimiter, strictRateLimiter } = require('../../src/middlewares/rateLimiter.middleware');
const { redisClient } = require('../../src/config/redis');
const logger = require('../../src/config/logger');
const { RedisClient } = require('redis');

// Mock Redis so it doesn't try to connect to a real server

jest.mock('../../src/config/redis', () => ({
    redisClient: {
        isOpen: true,
        connect: jest.fn().mockResolvedValue(),
        disconnect: jest.fn().mockResolvedValue(),
        sendCommand: jest.fn().mockImplementation((args) =>{

            if(Array.isArray(args) && args[0] === 'SCRIPT' && args[1] === 'LOAD'){
                return Promise.resolve('mock-sha')
            }

            return Promise.resolve([1, Date.now()+60000])
        })
    }
}));

// Mock logger to avoid cluttering test output and allow assertions
jest.mock('../../src/config/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
}));

describe('Rate Limiter Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            ip: '127.0.0.1',
            headers: {},
            user: { id: 'user-123' },
            originalPath: '/test'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });

    it('should pass to next function if request rate is under limit globally', async () => {
        await globalRateLimiter(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should pass to next function if request rate is under limit for strict routes', async () => {
        await strictRateLimiter(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });


    it('it should return 429 status with too many requests error message', async() =>{

        redisClient.sendCommand.mockResolvedValueOnce([101, Date.now()+60000]);

        await globalRateLimiter(mockReq, mockRes, mockNext)

        expect(mockNext).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(429)
        expect(mockRes.json).toHaveBeenCalledWith({
            success:false,
            error: 'Too many requests. please try again later'
        })
    })
   
});