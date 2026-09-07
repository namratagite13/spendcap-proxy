



const crypto = require('crypto');

const logger = require('../../src/config/logger.js');
const { errorHandler } = require('../../src/middlewares/errorHandler.middleware');



jest.mock('../../src/config/logger.js', () => ({
   
    warn: jest.fn(),
    error: jest.fn(), // Make sure error is included here
    info: jest.fn()
    
}))


describe('Error Handler', () =>{
    let mockError
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() =>{

        mockError = {
            error: {}
        }
        mockReq = {
            headers: {
                'x-correlation-id': 'random-crypto-uuid'
                
            },
            user: {},
            path : 'best-possible-dummy-path',
            stack : {}

        
        };
        mockRes = {
            setHeader : jest.fn().mockReturnThis(),
            status : jest.fn().mockReturnThis(),
            json : jest.fn()
        };
    
        
        mockNext =  jest.fn()

    })

    it('assign correlation id to variable and create response body', () =>{

        const correlationId = 'header is present'

        mockReq.headers = {'x-correlation-id': correlationId}
        errorHandler(mockError, mockReq, mockRes, mockNext)
        expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', correlationId)

        

        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error:{
            message: 'An unexpected internal error occurred',
            code: 'INTERNAL_SERVER_ERROR',
            correlationId
            }
        })

        
    })

    it('testing if error is caused by joi', () =>{

        const correlationId = 'random-crypto-uuid';
        const mockJoiError = {
            isJoi: true,
            details : [
               {
                path : ['email'],
                message : 'email is required'
               }
            ]
        }
        errorHandler(mockJoiError, mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: {
                message: 'Invalid request payload',
                code: 'VALIDATION ERROR', 
                details : [
                    {
                        field : 'email',
                        message : 'email is required'
                    }
                ],
                correlationId
            }
        })

    });
    
    it('if error code is less than 500 than change the response body', () =>{

        
        mockError.statusCode = 400
  
        const correlationId = 'random-crypto-uuid';
        
        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: expect.objectContaining({
                message: mockError.message,
                code: 'BAD_REQUEST',
                correlationId 
            })
        }))

    });

    it('if error code is more than and equal 500 than print logger warning', () =>{

        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(logger.error).toHaveBeenCalled()

    })

    it('else in any error causing pass logger warning', () =>{

        errorHandler(mockError, mockReq, mockRes, mockNext);
        expect(logger.warn).toHaveBeenCalled()

    })


})