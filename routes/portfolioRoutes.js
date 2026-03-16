const express = require('express');
const portfolioController = require('../controllers/portfolioController');

const router = express.Router();

// Fetch all clients
router.get('/clients', portfolioController.getClients.bind(portfolioController));

// Fetch current holdings for a single client
router.get('/portfolio/:clientId', portfolioController.getClientPortfolio.bind(portfolioController));

// Get summary status for all clients
router.get('/rebalance-summary', portfolioController.getRebalanceSummary.bind(portfolioController));

// Calculate required rebalance actions for a single client
router.get('/rebalance/:clientId', portfolioController.calculateRebalance.bind(portfolioController));

// Save a rebalancing session
router.post('/rebalance/save', portfolioController.saveRebalance.bind(portfolioController));

// Get rebalancing history for all clients
router.get('/rebalance/history', portfolioController.getHistory.bind(portfolioController));

// Get rebalancing history for a specific client
router.get('/rebalance/history/:clientId', portfolioController.getHistory.bind(portfolioController));

// Update the target model portfolio
router.put('/model-portfolio', portfolioController.updateModelPortfolio.bind(portfolioController));

module.exports = router;
