const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  clientId: { 
    type: String, 
    required: true 
  },
  fundId: { 
    type: String, 
    required: true 
  },
  fundName: { 
    type: String, 
    required: true 
  },
  currentValue: { 
    type: Number, 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Holding', holdingSchema);
