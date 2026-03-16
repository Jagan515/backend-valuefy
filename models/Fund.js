const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  fundId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  fundName: { 
    type: String, 
    required: true 
  },
  assetClass: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fund', fundSchema);
