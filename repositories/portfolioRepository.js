const { query, run, db } = require('../config/db');

class PortfolioRepository {
  /**
   * Retrieves all clients from SQLite
   */
  async getAllClients() {
    return await query('SELECT client_id as clientId, client_name as name, total_invested as totalInvested FROM clients');
  }

  /**
   * Retrieves current holdings for a specific client.
   */
  async getClientHoldings(clientId) {
    return await query('SELECT fund_id as fundId, fund_name as fundName, current_value as currentValue FROM client_holdings WHERE client_id = ?', [clientId]);
  }

  /**
   * Retrieves target model portfolio allocations.
   */
  async getModelPortfolio() {
    return await query('SELECT fund_id as fundId, fund_name as fundName, asset_class as assetClass, allocation_pct as allocationPct FROM model_funds');
  }

  /**
   * Updates a model fund's allocation percentage.
   */
  async updateModelAllocation(fundId, allocationPct) {
    return await run('UPDATE model_funds SET allocation_pct = ? WHERE fund_id = ?', [allocationPct, fundId]);
  }

  /**
   * Saves a rebalancing session summary.
   */
  async createRebalanceSession(sessionData) {
    const { clientId, portfolioValue, totalToBuy, totalToSell, netCashNeeded, status } = sessionData;
    const sql = `
      INSERT INTO rebalance_sessions 
      (client_id, created_at, portfolio_value, total_to_buy, total_to_sell, net_cash_needed, status)
      VALUES (?, datetime('now'), ?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [clientId, portfolioValue, totalToBuy, totalToSell, netCashNeeded, status]);
    return result.id;
  }

  /**
   * Saves an individual rebalance item.
   */
  async createRebalanceItem(itemData) {
    const { 
      sessionId, fundId, fundName, action, amount, 
      currentPct, targetPct, postRebalancePct, isModelFund 
    } = itemData;
    const sql = `
      INSERT INTO rebalance_items 
      (session_id, fund_id, fund_name, action, amount, current_pct, target_pct, post_rebalance_pct, is_model_fund)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await run(sql, [
      sessionId, fundId, fundName, action, amount, 
      currentPct, targetPct, postRebalancePct, isModelFund
    ]);
  }

  /**
   * Retrieves rebalance sessions for a client (or all if omitted).
   */
  async getRebalanceHistory(clientId = null) {
    let sql = 'SELECT * FROM rebalance_sessions';
    const params = [];
    if (clientId) {
      sql += ' WHERE client_id = ?';
      params.push(clientId);
    }
    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  /**
   * Retrieves items for a specific rebalance session.
   */
  async getRebalanceSessionItems(sessionId) {
    return await query('SELECT * FROM rebalance_items WHERE session_id = ?', [sessionId]);
  }
}

module.exports = new PortfolioRepository();
