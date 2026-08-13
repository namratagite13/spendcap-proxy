


const { GoogleGenAI } = require('@google/genai');
const { config } = require('./env');

const genAI = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY || process.env.GEMINI_API_KEY 
});

module.exports = { genAI };