# Portfolio Rebalancing Backend

This is the server-side component of the Portfolio Rebalancing application. It provides the REST API and the core business logic engine for financial calculations.

## 🏗️ Architecture
The backend follows a **Layered Architecture** pattern with a clean separation of concerns:

- **`controllers/`**: Handles incoming HTTP requests and structures JSON responses.
- **`services/`**: Contains the **Pure Business Logic** (Rebalancing Algorithm). No database calls allowed here.
- **`repositories/`**: The Data Access Layer (DAO). Handles all Mongoose/MongoDB queries.
- **`models/`**: Defines the MongoDB schemas using Mongoose.
- **`data/`**: Stores the legacy `model_portfolio.db` (SQLite).
- **`scripts/`**: Includes the `migrateSQLiteToMongo.js` utility.

## 🚀 Getting Started

### Environment Variables
Copy `.env.example` to `.env` and configure:
- `PORT`: Default is `5001` (to avoid macOS AirPlay conflicts).
- `MONGO_URI`: Your MongoDB connection string.

### Running the server
```bash
npm install
npm run dev
```

### Data Migration
To populate MongoDB with data from the SQLite database:
```bash
node scripts/migrateSQLiteToMongo.js
```

## 🧠 Business Logic: The Rebalance Algorithm
The engine calculates drift using:
1. `Target Cash = Total Portfolio Value * (Allocation %)`
2. `Difference = Target Cash - Current Value`
3. If `Difference > 0` → **BUY**
4. If `Difference < 0` → **SELL**
