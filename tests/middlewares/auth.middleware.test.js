


const { config } = require('../../src/config/env');

const logger = require('../../src/config/logger');
const { requireApiKey } = require('../../src/middlewares/auth.middleware');

jest.mock('../../src/config/env.js', () =>({
    config : {
        PROXY_KEY: 'dummy-proxy-key'
    }
}))

jest.mock('../../src/config/logger.js', () =>({
    
    warn: jest.fn()
    
}))



describe('Auth Middleware', () =>{

    //declaring variable here so they are globally available
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() =>{

        mockReq = {
            headers: {
                'x-api-key': 'dummy-proxy-key'
            },
            user: {}

        
        };
        mockRes = {
            status : jest.fn().mockReturnThis(),
            json : jest.fn()
        };
        
        mockNext =  jest.fn()

    })


    
    it('testing if PROXY KEY not available', () =>{
        
        config.PROXY_KEY = ''
        requireApiKey(mockReq, mockRes, mockNext)
        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.user).toEqual({id: 'local'})
        
    });


    it('checking if key is their and it is present than allowing user id as default', () =>{

        config.PROXY_KEY = 'dummy-proxy-key'
        mockReq.headers = {'x-api-key': 'dummy-proxy-key'}
        requireApiKey(mockReq, mockRes, mockNext)
        expect(mockReq.user).toEqual({
            id: 'default'
        })
        expect(mockNext).toHaveBeenCalled()
        expect(mockRes.status).not.toHaveBeenCalled()

    })


    it('if key is not match with config value than it should return status as false and json response)', () =>{

        config.PROXY_KEY = 'dummy-proxy-key'
        mockReq.headers = {'x-api-key': 'wrong key'}
         requireApiKey(mockReq, mockRes, mockNext)
            expect(logger.warn).toHaveBeenCalled()
            expect(mockRes.status).toHaveBeenCalledWith(401)
            expect(mockRes.json).toHaveBeenCalledWith({
                 success: false,
                error: 'Unauthorized',
                message: 'Missing or invalid x-api-key header.'
            })
            expect(mockNext).not.toHaveBeenCalled()
        
    })


})