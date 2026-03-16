require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', portfolioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', target: 'MERN Portfolio Backend' });
});

// Start Server and Connect DB
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API is available at /api/`);
  });
};

startServer();
