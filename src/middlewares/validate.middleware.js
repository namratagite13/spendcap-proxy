

const Joi = require('joi');

const generateSchema = Joi.object({
    prompt: Joi.string().trim().min(1).max(2000).required().messages({
        'string.empty': 'Prompt cannot be empty.',
        'string.max': 'Prompt exceeds maximum character limit of 2000 characters.',
    }),
    modelName: Joi.string()
    .valid('gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-flash-latest')
    .default('gemini-flash-latest'),
    maxOutputTokens: Joi.number().integer().min(1).max(1000).default(500)
});

const validateGeneratePayload = (req, res, next) => {
    const { error, value } = generateSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
       return next(error) 
    }
    
    req.body = value; // Replace with sanitized/validated values
    next();
};

module.exports = {validateGeneratePayload}