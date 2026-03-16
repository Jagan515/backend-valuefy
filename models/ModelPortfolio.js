const mongoose = require('mongoose');

const modelPortfolioSchema = new mongoose.Schema({
  fundId: { 
    type: String, 
    required: true 
  },
  fundName: { 
    type: String, 
    required: true 
  },
  allocationPct: { 
    type: Number, 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModelPortfolio', modelPortfolioSchema);
