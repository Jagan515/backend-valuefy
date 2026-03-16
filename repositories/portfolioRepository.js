const { Client, Holding, ModelPortfolio } = require('../models');

class PortfolioRepository {
  /**
   * Retrieves all clients from MongoDB
   * @returns {Promise<Array>}
   */
  async getAllClients() {
    return await Client.find({}).lean();
  }

  /**
   * Retrieves the current fund holdings for a specific client.
   * @param {string} clientId
   * @returns {Promise<Array>}
   */
  async getClientHoldings(clientId) {
    return await Holding.find({ clientId }).lean();
  }

  /**
   * Retrieves the target model portfolio allocations.
   * @returns {Promise<Array>}
   */
  async getModelPortfolio() {
    return await ModelPortfolio.find({}).lean();
  }
}

module.exports = new PortfolioRepository();
