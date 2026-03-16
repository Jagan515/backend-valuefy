const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  totalInvested: { 
    type: Number, 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
