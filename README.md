# Switch: Decentralised Time-Locked Savings

**Switch** is a DeFi application running on the Ethereum Sepolia Testnet that allows users to lock away their Ether (ETH) for a specific duration. The smart contract strictly prevents withdrawal until the timer hits zero, removing the temptation to spend your savings early.

![Project Status](https://img.shields.io/badge/Status-Live_Beta-green)
![Network](https://img.shields.io/badge/Network-Sepolia_Testnet-blue)

## 🚀 Features

- **Smart Vaults:** Create multiple savings locks with unique titles (e.g., "Car Fund").
- **Strict Enforcement:** Funds are cryptographically locked on-chain. No admin, including the creator, can unlock them early.
- **Real-Time Status:** Live countdown timers showing exactly when funds become available.
- **Visual Dashboard:** Dark-mode UI with glassmorphism effects for a modern experience.
- **Withdrawal Protection:** Only the wallet that deposited the funds can withdraw them.

## 🛠 Tech Stack

**Frontend:**

- React (Vite)
- TypeScript
- Tailwind CSS (v3)
- Ethers.js (v6)
- Zustand (State Management)

**Backend / Smart Contract:**

- Solidity (v0.8.0+)
- Brownie (Python Framework)
- Alchemy (RPC Provider)
- Sepolia Testnet

---

## 🧪 How to Test (User Guide)

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
    - **Time:** 60 (Seconds)
4.  Click **"Lock Funds"** and approve the transaction in MetaMask.

### 4. Withdraw

1.  Wait for the transaction to confirm. A green **"Active Savings"** card will appear.
2.  Watch the countdown reach 0.
3.  When it says **"Ready to Withdraw!"**, a red Withdraw button will appear.
4.  Click it to return the ETH to your wallet.

---

## 💻 Local Installation Guide

If you want to run this code on your own machine:

### Prerequisites

- Node.js & npm
- Python 3 & pip
- `eth-brownie` installed globally

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/switch-savings.git](https://github.com/YOUR_USERNAME/switch-savings.git)
cd switch-savings
```

### 2. Smart Contract (Backend)

```bash
cd backend
# Compile the contract
brownie compile
# Deploy to Sepolia (Requires .env file with PRIVATE_KEY and WEB3_INFURA_PROJECT_ID)
brownie run deploy_sepolia --network sepolia
```

### 3. Frontend

```bsh
cd frontend
# Install dependencies
npm install
# Run the development server
npm run dev
```
