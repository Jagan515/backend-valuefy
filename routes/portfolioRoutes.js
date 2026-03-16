const express = require('express');
const portfolioController = require('../controllers/portfolioController');

const router = express.Router();

// Fetch all clients
router.get('/clients', portfolioController.getClients.bind(portfolioController));

// Fetch current holdings for a single client
router.get('/portfolio/:clientId', portfolioController.getClientPortfolio.bind(portfolioController));

// Calculate required rebalance actions for a single client
router.get('/rebalance/:clientId', portfolioController.calculateRebalance.bind(portfolioController));

module.exports = router;
