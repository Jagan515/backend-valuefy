/**
 * Calculates the required actions (BUY/SELL) to rebalance a client's portfolio
 * back to the target model allocation.
 *
 * @param {Array} currentHoldings - Array of current Mongoose Holding documents
 * @param {Array} modelPortfolio - Array of target Mongoose ModelPortfolio documents
 * @param {number} totalPortfolioValue - Total value of all current holdings
 * @returns {Array} List of actions: [{ fund: "Equity", action: "SELL", amount: 20000 }]
 */
function calculateRebalanceActions(currentHoldings, modelPortfolio, totalPortfolioValue) {

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

  // 5% rebalance threshold
  const threshold = totalPortfolioValue * 0.05;

  allFundIds.forEach(fundId => {

    const holding = holdingsMap[fundId];
    const target = modelMap[fundId];

    const currentValue = holding ? holding.currentValue : 0;
    const allocationPct = target ? target.allocationPct : 0;
    const fundName = target ? target.fundName : holding.fundName;

    const targetValue = totalPortfolioValue * (allocationPct / 100);
    const difference = targetValue - currentValue;

    // Ignore floating point differences
    if (Math.abs(difference) < 0.01) return;

    // Ignore small drifts below threshold
    if (Math.abs(difference) < threshold) return;

    if (difference > 0) {
      actions.push({
        fund: fundName,
        action: 'BUY',
        amount: Number(difference.toFixed(2))
      });
    } else {
      actions.push({
        fund: fundName,
        action: 'SELL',
        amount: Number(Math.abs(difference).toFixed(2))
      });
    }

  });

  return actions;
}

module.exports = {
  calculateRebalanceActions
};