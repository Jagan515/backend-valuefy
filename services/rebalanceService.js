/**
 * Calculates the required actions (BUY/SELL) to rebalance a client's portfolio
 * back to the target model allocation.
 *
 * @param {Array} currentHoldings - Array of current Mongoose Holding documents
 * @param {Array} modelPortfolio - Array of target Mongoose ModelPortfolio documents
 * @param {number} totalPortfolioValue - Total value of all current holdings
 * @returns {Array} List of actions: [{ fund: "Equity", action: "SELL", amount: 20000 }]
 */
function calculateRebalanceActions(currentHoldings, modelPortfolio, totalPortfolioValue, newInvestment = 0) {

  const totalCapital = totalPortfolioValue + newInvestment;
  const holdingsMap = {};
  currentHoldings.forEach(h => {
    holdingsMap[h.fundId] = h;
  });

  const allFundIds = new Set([
    ...currentHoldings.map(h => h.fundId),
    ...modelPortfolio.map(m => m.fundId)
  ]);

  const actions = [];

  const modelMap = {};
  modelPortfolio.forEach(m => {
    modelMap[m.fundId] = m;
  });

  allFundIds.forEach(fundId => {
    const holding = holdingsMap[fundId];
    const target = modelMap[fundId];

    const currentValue = holding ? holding.currentValue : 0;
    const allocationPct = target ? target.allocationPct : 0;
    const fundName = target ? target.fundName : holding.fundName;

    // Handle funds NOT in the model portfolio
    if (!target) {
      actions.push({
        fundId,
        fund: fundName,
        action: 'REVIEW',
        amount: currentValue,
        currentPct: Number(((currentValue / totalPortfolioValue) * 100).toFixed(2)),
        targetPct: 0,
        postRebalancePct: 0, // After liquidation/liquidity use
        isModelFund: false
      });
      return;
    }

    const targetValue = totalCapital * (allocationPct / 100);
    const difference = targetValue - currentValue;
    const currentPct = (currentValue / totalPortfolioValue) * 100;

    // We include all model funds in the response, even if drift is 0
    actions.push({
      fundId,
      fund: fundName,
      action: difference > 0 ? 'BUY' : (difference < 0 ? 'SELL' : 'NONE'),
      amount: Number(Math.abs(difference).toFixed(2)),
      currentPct: Number(currentPct.toFixed(2)),
      targetPct: allocationPct,
      postRebalancePct: allocationPct, // Assuming perfect rebalance
      isModelFund: true
    });
  });

  return actions;
}

module.exports = {
  calculateRebalanceActions
};