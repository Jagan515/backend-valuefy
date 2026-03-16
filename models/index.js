const mongoose = require('mongoose');

// Define Client Schema
const clientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true }, // e.g., 'C001'
  name: { type: String, required: true },
  totalInvested: { type: Number, required: true }
});

// Define Holding Schema
const holdingSchema = new mongoose.Schema({
  clientId: { type: String, required: true, ref: 'Client' },
  fundId: { type: String, required: true },
  fundName: { type: String, required: true },
  currentValue: { type: Number, required: true }
});

// Define Fund Schema
const fundSchema = new mongoose.Schema({
  fundId: { type: String, required: true, unique: true },
  fundName: { type: String, required: true },
  assetClass: { type: String, required: true }
});

// Define ModelPortfolio Schema
const modelPortfolioSchema = new mongoose.Schema({
  fundId: { type: String, required: true, ref: 'Fund' },
  fundName: { type: String, required: true },
  allocationPct: { type: Number, required: true }
});

// Export Models
module.exports = {
  Client: mongoose.model('Client', clientSchema, 'clients'),
  Holding: mongoose.model('Holding', holdingSchema, 'holdings'),
  Fund: mongoose.model('Fund', fundSchema, 'funds'),
  ModelPortfolio: mongoose.model('ModelPortfolio', modelPortfolioSchema, 'modelPortfolio')
};
