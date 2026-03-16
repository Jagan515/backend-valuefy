const Client = require('../models/Client');
const Holding = require('../models/Holding');
const ModelPortfolio = require('../models/ModelPortfolio');

class PortfolioDao {
  /**
   * Retrieves all clients from the database.
   * @returns {Promise<Array>} List of clients as plain JavaScript objects.
   */
  async getAllClients() {
    return await Client.find({}).lean();
  }

  /**
   * Retrieves the current fund holdings for a specific client.
   * @param {string} clientId - The ID of the client.
   * @returns {Promise<Array>} List of client holdings as plain JavaScript objects.
   */
  async getClientHoldings(clientId) {
    return await Holding.find({ clientId }).lean();
  }

  /**
   * Retrieves the target model portfolio allocations.
   * @returns {Promise<Array>} List of model portfolio allocations as plain JavaScript objects.
   */
  async getModelPortfolio() {
    return await ModelPortfolio.find({}).lean();
  }
}

module.exports = new PortfolioDao();
