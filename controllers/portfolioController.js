const portfolioRepository = require('../repositories/portfolioRepository');
const { calculateRebalanceActions } = require('../services/rebalanceService');

class PortfolioController {
  /**
   * GET /api/clients
   * Fetches the complete list of clients.
   */
  async getClients(req, res) {
    try {
      const clients = await portfolioRepository.getAllClients();
      // Remove Mongoose tracking logic before sending
      const cleanClients = clients.map(c => ({
        clientId: c.clientId,
        name: c.name,
        totalInvested: c.totalInvested
      }));
      res.status(200).json({ success: true, data: cleanClients });
    } catch (error) {
      console.error('Error in getClients:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients' });
    }
  }

  /**
   * GET /api/portfolio/:clientId
   * Fetches a specific client's current fund holdings.
   */
  async getClientPortfolio(req, res) {
    try {
      const { clientId } = req.params;
      
      const holdings = await portfolioRepository.getClientHoldings(clientId);
      
      if (!holdings || holdings.length === 0) {
        return res.status(404).json({ success: false, error: 'Client not found or holds no assets' });
      }

      const totalInvested = holdings.reduce((sum, h) => sum + h.currentValue, 0);

      // Clean metadata
      const cleanHoldings = holdings.map(h => ({
        fundId: h.fundId,
        fundName: h.fundName,
        currentValue: h.currentValue
      }));

      res.status(200).json({ 
        success: true, 
        data: {
          clientId,
          totalInvested,
          holdings: cleanHoldings
        } 
      });
    } catch (error) {
      console.error('Error in getClientPortfolio:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch portfolio data' });
    }
  }

  /**
   * GET /api/rebalance/:clientId
   * Calculates the required buy/sell actions to rebalance a client's portfolio.
   */
  async calculateRebalance(req, res) {
    try {
      const { clientId } = req.params;

      // 1. Fetch current MongoDB holdings
      const currentHoldings = await portfolioRepository.getClientHoldings(clientId);
      
      if (!currentHoldings || currentHoldings.length === 0) {
        return res.status(404).json({ success: false, error: 'Client not found or holds no assets to rebalance' });
      }

      // 2. Fetch the target model portfolio from MongoDB
      const modelPortfolio = await portfolioRepository.getModelPortfolio();
      
      // Calculate total current value
      const totalPortfolioValue = currentHoldings.reduce((sum, h) => sum + h.currentValue, 0);

      // 3. Apply the pure service logic
      const requiredActions = calculateRebalanceActions(
        currentHoldings, 
        modelPortfolio, 
        totalPortfolioValue
      );

      // We'll also return the modelPortfolio so the frontend can display it easily
      const cleanModelPortfolio = modelPortfolio.map(m => ({
        fundId: m.fundId,
        fundName: m.fundName,
        allocationPct: m.allocationPct
      }));

      res.status(200).json({
        success: true,
        data: {
          clientId,
          totalPortfolioValue,
          modelAllocation: cleanModelPortfolio,
          actions: requiredActions
        }
      });
    } catch (error) {
      console.error('Error in calculateRebalance:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate rebalance actions' });
    }
  }

  /**
   * GET /api/rebalance-summary
   * Fetches a summary of all clients and their rebalance status.
   */
  async getRebalanceSummary(req, res) {
    try {
      const clients = await portfolioRepository.getAllClients();
      const modelPortfolio = await portfolioRepository.getModelPortfolio();

      const summary = await Promise.all(clients.map(async (client) => {
        const holdings = await portfolioRepository.getClientHoldings(client.clientId);
        const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
        
        const actions = calculateRebalanceActions(holdings, modelPortfolio, totalValue);
        
        return {
          clientId: client.clientId,
          name: client.name,
          totalInvested: client.totalInvested,
          currentValue: totalValue,
          status: actions.length > 0 ? 'Drifted' : 'Balanced',
          actionCount: actions.length
        };
      }));

      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      console.error('Error in getRebalanceSummary:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rebalance summary' });
    }
  }
}

module.exports = new PortfolioController();
