const portfolioRepository = require('../repositories/portfolioRepository');
const { calculateRebalanceActions } = require('../services/rebalanceService');

class PortfolioController {
  /**
   * GET /api/clients
   */
  async getClients(req, res) {
    try {
      const clients = await portfolioRepository.getAllClients();
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      console.error('Error in getClients:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients' });
    }
  }

  /**
   * GET /api/portfolio/:clientId
   */
  async getClientPortfolio(req, res) {
    try {
      const { clientId } = req.params;
      const holdings = await portfolioRepository.getClientHoldings(clientId);
      
      if (!holdings || holdings.length === 0) {
        return res.status(404).json({ success: false, error: 'Client not found or holds no assets' });
      }

      const totalInvested = holdings.reduce((sum, h) => sum + h.currentValue, 0);

      res.status(200).json({ 
        success: true, 
        data: {
          clientId,
          totalInvested,
          holdings
        } 
      });
    } catch (error) {
      console.error('Error in getClientPortfolio:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch portfolio data' });
    }
  }

  /**
   * GET /api/rebalance/:clientId
   */
  async calculateRebalance(req, res) {
    try {
      const { clientId } = req.params;
      const { newInvestment } = req.query;
      const currentHoldings = await portfolioRepository.getClientHoldings(clientId);
      
      if (!currentHoldings || currentHoldings.length === 0) {
        return res.status(404).json({ success: false, error: 'Client not found or holds no assets to rebalance' });
      }

      const modelPortfolio = await portfolioRepository.getModelPortfolio();
      const totalPortfolioValue = currentHoldings.reduce((sum, h) => sum + h.currentValue, 0);

      const actions = calculateRebalanceActions(
        currentHoldings, 
        modelPortfolio, 
        totalPortfolioValue,
        parseFloat(newInvestment) || 0
      );

      res.status(200).json({
        success: true,
        data: {
          clientId,
          totalPortfolioValue,
          modelAllocation: modelPortfolio,
          actions
        }
      });
    } catch (error) {
      console.error('Error in calculateRebalance:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate rebalance actions' });
    }
  }

  /**
   * GET /api/rebalance-summary
   */
  async getRebalanceSummary(req, res) {
    try {
      const clients = await portfolioRepository.getAllClients();
      const modelPortfolio = await portfolioRepository.getModelPortfolio();

      const summary = await Promise.all(clients.map(async (client) => {
        const holdings = await portfolioRepository.getClientHoldings(client.clientId);
        const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
        
        const actions = calculateRebalanceActions(holdings, modelPortfolio, totalValue);
        const driftActions = actions.filter(a => a.action !== 'NONE' && a.action !== 'REVIEW');
        
        return {
          clientId: client.clientId,
          name: client.name,
          totalInvested: client.totalInvested,
          currentValue: totalValue,
          status: driftActions.length > 0 ? 'Drifted' : 'Balanced',
          actionCount: driftActions.length
        };
      }));

      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      console.error('Error in getRebalanceSummary:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rebalance summary' });
    }
  }

  /**
   * POST /api/rebalance/save
   */
  async saveRebalance(req, res) {
    try {
      const { clientId, portfolioValue, actions, status } = req.body;

      const totalToBuy = actions
        .filter(a => a.action === 'BUY')
        .reduce((sum, a) => sum + a.amount, 0);
      
      const totalToSell = actions
        .filter(a => a.action === 'SELL')
        .reduce((sum, a) => sum + a.amount, 0);

      const sessionData = {
        clientId,
        portfolioValue,
        totalToBuy,
        totalToSell,
        netCashNeeded: totalToBuy - totalToSell,
        status: status || 'PENDING'
      };

      const sessionId = await portfolioRepository.createRebalanceSession(sessionData);

      for (const action of actions) {
        await portfolioRepository.createRebalanceItem({
          sessionId,
          fundId: action.fundId,
          fundName: action.fund,
          action: action.action,
          amount: action.amount,
          currentPct: action.currentPct,
          targetPct: action.targetPct,
          postRebalancePct: action.postRebalancePct,
          isModelFund: action.isModelFund ? 1 : 0
        });
      }

      res.status(201).json({ success: true, sessionId });
    } catch (error) {
      console.error('Error in saveRebalance:', error);
      res.status(500).json({ success: false, error: 'Failed to save rebalance session' });
    }
  }

  /**
   * GET /api/rebalance/history/:clientId?
   */
  async getHistory(req, res) {
    try {
      const { clientId } = req.params;
      const history = await portfolioRepository.getRebalanceHistory(clientId);
      
      const historyWithItems = await Promise.all(history.map(async (session) => {
        const items = await portfolioRepository.getRebalanceSessionItems(session.session_id);
        return { ...session, items };
      }));

      res.status(200).json({ success: true, data: historyWithItems });
    } catch (error) {
      console.error('Error in getHistory:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch rebalance history' });
    }
  }

  /**
   * PUT /api/model-portfolio
   */
  async updateModelPortfolio(req, res) {
    try {
      const { allocations } = req.body; // Array of { fundId, allocationPct }
      
      const total = allocations.reduce((sum, a) => sum + a.allocationPct, 0);
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({ success: false, error: 'Allocations must sum up to exactly 100%' });
      }

      for (const allocation of allocations) {
        await portfolioRepository.updateModelAllocation(allocation.fundId, allocation.allocationPct);
      }

      res.status(200).json({ success: true, message: 'Model portfolio updated successfully' });
    } catch (error) {
      console.error('Error in updateModelPortfolio:', error);
      res.status(500).json({ success: false, error: 'Failed to update model portfolio' });
    }
  }
}

module.exports = new PortfolioController();
