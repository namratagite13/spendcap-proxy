//Approximate pricing per 1M tokens (Standard Gemini Tiers)

const PRICING_TIERS = {
    'gemini-1.5.flash' : {promptCostPer1M:  0.075, candidateCostPer1M: 0.30},
    'gemini-2.5-flash': { promptCostPer1M: 0.075, candidateCostPer1M: 0.30 },
    'gemini-1.5-pro': { promptCostPer1M: 1.25, candidateCostPer1M: 5.00 },
    'gemini-2.5-pro': { promptCostPer1M: 1.25, candidateCostPer1M: 5.00 },
    'gemini-flash-latest': { promptCostPer1M: 0.075, candidateCostPer1M: 0.30 },
    'gemini-flash-lite-latest': { promptCostPer1M: 0.0375, candidateCostPer1M: 0.15 }, // verify actual lite pricing
    'gemini-2.5-flash-lite': { promptCostPer1M: 0.0375, candidateCostPer1M: 0.15 },
};

// Calculates prompt cost and total tokens from Gemini SDK usageMetadata

const calculateTokenMetrics = (usageMetadata, modelName= "gemini-1.5-flash") =>{

    if(!usageMetadata){
        return {promptToken: 0, completionToken: 0, thoughtsTokenCount:0, totalTokens: 0, estimatedToken: 0};
    }

    const promptToken = usageMetadata.promptTokenCount || 0;
    const completionToken = usageMetadata.candidatesTokenCount || 0;
    const totalToken = usageMetadata.totalTokenCount || (promptToken+completionToken);
    const thoughtsToken = usageMetadata.thoughtsTokenCount || 0

    const key = modelName.toLowerCase();
    const pricing = PRICING_TIERS[key] || PRICING_TIERS['gemini-1.5-flash'];

    const promptCost = (promptToken / 1_000_000) * pricing.promptCostPer1M;
    const completionCost = ((completionToken + thoughtsToken )/ 1_000_000) * pricing.candidateCostPer1M;
    const estimatedCostUsd= Number((promptCost + completionCost).toFixed(6));

    return {
        promptTokenCount: promptToken,
        candidatesTokenCount: completionToken,
        thoughtsTokenCount: thoughtsToken,
        totalTokenCount: totalToken,
        estimatedCostUsd
    }
};

module.exports = {calculateTokenMetrics}