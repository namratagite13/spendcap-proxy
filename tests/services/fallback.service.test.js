
const { generateFallbackResponse } = require("../../src/services/fallback.service")
const logger = require('../../src/config/logger.js')
const { genAI } = require("../../src/config/gemini")




jest.mock('../../src/config/logger.js', () =>({

    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
}))


jest.mock('../../src/config/gemini.js', () =>({
    genAI : {
        models: {
            generateContent: jest.fn()
        }
    }
}))


describe('Fallback Service', () =>{

    it("it should fall back to secondary model when primary model is fail", async() =>{
        let prompt = 'some-prompt-here';
  
        const FALLBACK_MODEL = 'gemini-flash-lite-latest'
        


        genAI.models.generateContent.mockResolvedValue({
            text: 'fallback response successful',
            usageMetaData: expect.any(Object)
        })

        const result = await generateFallbackResponse(prompt)
        //const responseA = await genAI.models.generateContent()
        expect(logger.info).toHaveBeenCalled()
        expect(genAI.models.generateContent).toHaveBeenCalledWith({
            model: FALLBACK_MODEL,
            contents : prompt
        })
        expect(result).toEqual({
            text : 'fallback response successful',
            model: FALLBACK_MODEL,
            provider: `fallback (${FALLBACK_MODEL})`,
            isFallback: true,
            tokens: expect.any(Object)
        });
    })
});