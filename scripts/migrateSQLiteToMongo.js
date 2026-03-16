require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const mongoose = require('mongoose');

// ==========================================
// 1. Mongoose Models Definition
// ==========================================
const clientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  totalInvested: { type: Number, required: true }
});

const holdingSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  fundId: { type: String, required: true },
  fundName: { type: String, required: true },
  currentValue: { type: Number, required: true }
});

const fundSchema = new mongoose.Schema({
  fundId: { type: String, required: true, unique: true },
  fundName: { type: String, required: true },
  assetClass: { type: String, required: true }
});

const modelPortfolioSchema = new mongoose.Schema({
  fundId: { type: String, required: true },
  fundName: { type: String, required: true },
  allocationPct: { type: Number, required: true }
});

const Client = mongoose.model('Client', clientSchema, 'clients');
const Holding = mongoose.model('Holding', holdingSchema, 'holdings');
const Fund = mongoose.model('Fund', fundSchema, 'funds');
const ModelPortfolio = mongoose.model('ModelPortfolio', modelPortfolioSchema, 'modelPortfolio');

// ==========================================
// 2. Database Connection Setup
// ==========================================
const dbPath = path.resolve(__dirname, '../data/model_portfolio.db'); // Point to your actual sqlite db file
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolioDB';

const sqliteDB = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database.');
});

// Helper function to turn SQLite queries into modern Promises
const querySQLite = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDB.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ==========================================
// 3. Migration Logic
// ==========================================
const migrateData = async () => {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at ${mongoURI}...`);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB.');

    // Clear existing collections safely
    console.log('Clearing old collections to prepare for fresh migration...');
    await Client.deleteMany({});
    await Holding.deleteMany({});
    await Fund.deleteMany({});
    await ModelPortfolio.deleteMany({});

    // -- Migrate Clients --
    const sqClients = await querySQLite('SELECT * FROM clients');
    const mongoClients = sqClients.map(c => ({
      clientId: c.client_id,
      name: c.client_name,
      totalInvested: c.total_invested
    }));
    if (mongoClients.length > 0) await Client.insertMany(mongoClients);
    console.log(`✅ Migrated ${mongoClients.length} rows to 'clients' collection.`);

    // -- Migrate Holdings --
    const sqHoldings = await querySQLite('SELECT * FROM client_holdings');
    const mongoHoldings = sqHoldings.map(h => ({
      clientId: h.client_id,
      fundId: h.fund_id,
      fundName: h.fund_name,
      currentValue: h.current_value
    }));
    if (mongoHoldings.length > 0) await Holding.insertMany(mongoHoldings);
    console.log(`✅ Migrated ${mongoHoldings.length} rows to 'holdings' collection.`);

    // -- Migrate Funds & Model Portfolio --
    // Both of these logically derive from the SQLite 'model_funds' table depending on your initial architecture
    const sqModelFunds = await querySQLite('SELECT * FROM model_funds');
    
    const mongoFunds = sqModelFunds.map(f => ({
      fundId: f.fund_id,
      fundName: f.fund_name,
      assetClass: f.asset_class
    }));
    if (mongoFunds.length > 0) await Fund.insertMany(mongoFunds);
    console.log(`✅ Migrated ${mongoFunds.length} rows to 'funds' collection.`);

    const mongoModelPortfolio = sqModelFunds.map(f => ({
      fundId: f.fund_id,
      fundName: f.fund_name,
      allocationPct: f.allocation_pct
    }));
    if (mongoModelPortfolio.length > 0) await ModelPortfolio.insertMany(mongoModelPortfolio);
    console.log(`✅ Migrated ${mongoModelPortfolio.length} rows to 'modelPortfolio' collection.`);

    console.log('\n🎉 All Data Migration Completed Successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // 4. Close Both Connections
    console.log('Closing database connections...');
    sqliteDB.close((err) => {
      if (err) console.error('Error closing SQLite DB:', err.message);
      else console.log('SQLite connection closed.');
    });
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
};

// Execute
migrateData();
