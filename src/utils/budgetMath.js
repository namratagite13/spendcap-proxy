

const getSoftLimitUSD = (maxBudgetUSD, softLimitUSD) => maxBudgetUSD * softLimitUSD;

const getPercentUSD = (currentSpendUSD, maxBudgetUSD) =>{
    Math.round((currentSpendUSD / maxBudgetUSD)*100);
};

module.exports = {
    getSoftLimitUSD,
    getPercentUSD
};
