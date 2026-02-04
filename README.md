# Switch: Decentralised Time-Locked Savings

**Switch** is a DeFi application on the Ethereum Sepolia Testnet. It allows users to cryptographically lock Ether (ETH) for a fixed duration, preventing premature withdrawals.

Unlike standard dApps that query the blockchain directly (which is slow), Switch utilizes a custom Python Indexer and PostgreSQL database to provide instant data retrieval, a "Gasless" dashboard experience, and real-time updates.

![Project Status](https://img.shields.io/badge/Status-Live_Beta-green)
![Network](https://img.shields.io/badge/Network-Sepolia_Testnet-blue)

## 🔗 Live Links

- **Frontend (Vercel):** https://switch-smart-vault.vercel.app
- **Backend API (Render):** https://switch-api-erex.onrender.com/docs

## 🚀 Features

- **Smart Vaults:** Create multiple savings locks with unique titles (e.g., "Car Fund").
- **Real-Time Status:** Live countdown timers showing exactly when funds become available.
- **Hybrid Architecture:**
  - **On-Chain Security:** Funds are held by a Solidity Smart Contract.

  - **Off-Chain Speed:** UI is powered by a high-performance Python backend.

- **Custom Indexer:** A background worker that watches the blockchain and syncs events to a local database in real-time.

- **SIWE Authentication:** Secure "Sign-In With Ethereum" using cryptographic signatures (Nonces) and JWTs—no passwords required.

- **Optimistic UI:** Interface updates almost instantly while transactions confirm in the background.

- **Strict Enforcement:** No admin keys. No backdoors. You cannot withdraw until the timer hits zero (or if you decide to use the emergency withdrawal function with a 10% penalty)

## 🛠 Tech Stack

**Frontend:**

- **Framework:** React (Vite)
- **Language:** TypeScript
- **State Management:** Zustand
- **Styling:** SCSS / Glassmorphism UI
- **Blockchain Interaction:** Ethers.js (v6)

**Backend / Smart Contract:**

- **Smart Contract:** Solidity (v0.8.0+), Framework (Brownie (Eth-Brownie))
- **API Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** SQLAlchemy (Async)
- **Blockchain Interface:** Web3.py
- **Indexer:** Custom multi-threaded event listener

---

## 💻 Local Installation Guide

If you want to run this code on your own machine:

### Prerequisites

- Node.js & npm
- Python 3 & pip
- `eth-brownie` installed globally
- Docker / Docker Compose

### Option A: Docker Compose (Recommended)

This will spin up the Frontend, Backend, and a local PostgreSQL database automatically.

### 1. Clone the Repository

```bash
git clone https://github.com/aluyapeter/switch-smart-vault.git
cd switch-smart-vault
```

### 2. Database Setup (Docker)

The backend requires a database connection and an RPC URL to talk to the blockchain. We use Docker to spin up a local PostgreSQL instance instantly.

```bash
cd backend

# 1. Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure Environment Variables
# Create a .env file in the /backend folder and add:

# Database
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=switch_db
DATABASE_URL="postgresql+asyncpg://user:password@localhost/switch_db"

# Blockchain (Sepolia)
RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
PRIVATE_KEY="your_wallet_private_key" # Needed for Brownie deployment only

# Auth
JWT_SECRET="supersecretkey"
ALGORITHM="HS256"

# Start the database in the background
docker-compose up -d
```

### 3. Smart Contract (Brownie)

Compile and deploy the contracts to the testnet.

```bash
cd backend

# Compile Contracts
brownie compile

# Deploy to Sepolia (Requires .env with PRIVATE_KEY and WEB3_INFURA_PROJECT_ID)
brownie run deploy_sepolia --network sepolia
```

### 4. Backend API

Run the FastAPI server and Indexer locally.

```bash
# ensure DATABASE_URL matches your Docker config (e.g., postgresql+asyncpg://user:password@localhost/switch_db)

# Run the API
uvicorn main:app --reload
```

### API is live at http://localhost:8000

### 5. Frontend

```bash
cd ../frontend

# 1. Install dependencies
npm install

# 2. Configure Environment Variables (.env)
# VITE_API_URL="http://localhost:8000"

# 3. Run the development server
npm run dev -- --port 3000
```

### App is live at http://localhost:3000

---

## 🧪 User Guide (Sepolia Testnet)

Since this is running on the **Sepolia Testnet**, you do not need real money to test it. Follow these steps:

### 1. Get a Wallet

Install the **[MetaMask](https://metamask.io/)** browser extension.

### 2. Get Test Funds (Sepolia ETH)

You need "fake" ETH to pay for gas fees.

1.  Go to [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) or [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
2.  Enter your wallet address and claim ETH.

### 3. Connect & Lock

1.  Open the App.
2.  Click **"Connect MetaMask"**.
3.  Under **"Create New Lock"**, enter:
    - **Goal Name:** "Test Savings"
    - **Amount:** 0.01 (ETH)
    - **Time:** 1 (Days)
4.  Click **"Lock Funds"** and approve the transaction in MetaMask.

### 4. Withdraw

1.  Wait for the transaction to confirm. A green **"Active Savings"** card will appear.
2.  Watch the countdown reach 0.
3.  When it says **"Ready to Withdraw!"**, a red Withdraw button will appear.
4.  Click it to return the ETH to your wallet.
5.  An emergency withdrawal can be done with a 10% penalty if you want to withdraw before the unlock date

---

# **⚠️ Troubleshooting**

"Authentication Failed" on Mobile: Ensure you are using the browser inside the MetaMask app. Standard mobile browsers (Chrome/Safari) cannot connect to your wallet unless you use WalletConnect.

"Locks not showing up": The dashboard reads from the database. If you minted a lock directly on Etherscan or before the Indexer was deployed, it might not appear on the dashboard. Create a new lock to see the system in action.

Author: Peter Aluya License: MIT
