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
  // Map current holdings for quick lookup
  const holdingsMap = {};
  currentHoldings.forEach(h => {
    holdingsMap[h.fundId] = h;
  });

  // Track all unique funds to process (ensure we sell orphaned holdings)
  const allFundIds = new Set([
    ...currentHoldings.map(h => h.fundId),
    ...modelPortfolio.map(m => m.fundId)
  ]);

  const actions = [];

  // Map model targets for quick lookup
  const modelMap = {};
  modelPortfolio.forEach(m => {
    modelMap[m.fundId] = m;
  });

  allFundIds.forEach(fundId => {
    const holding = holdingsMap[fundId];
    const target = modelMap[fundId];

    const currentValue = holding ? holding.currentValue : 0;
    // Database returns allocationPct (e.g., 50 for 50%)
    const allocationPct = target ? target.allocationPct : 0;
    const fundName = target ? target.fundName : holding.fundName;

    // Target cash value
    const targetValue = totalPortfolioValue * (allocationPct / 100);
    const difference = targetValue - currentValue;

    // Ignore tiny floating point differences
    if (Math.abs(difference) < 0.01) return;

    if (difference > 0) {
      actions.push({
        fund: fundName,
        action: 'BUY',
        amount: Number(difference.toFixed(2))
      });
    } else if (difference < 0) {
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
