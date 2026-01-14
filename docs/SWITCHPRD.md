# Product Requirements Document: Decentralized Time-Locked Savings

## 1. Executive Summary

### 1.1 Product Overview

A decentralized application (dApp) that allows users to lock their cryptocurrency (ETH) in a smart contract for a predetermined period. This helps users commit to savings goals by making funds inaccessible until the unlock date, enforcing financial discipline through blockchain immutability.

### 1.2 Goals

- Enable users to create time-locked savings deposits

- Provide transparency and trustless execution via smart contracts

- Offer a user-friendly interface for managing multiple savings goals

- Support early withdrawal with penalties (optional feature)

### 1.3 Success Metrics

- Number of active savings locks created

- Total value locked (TVL) in the contract

- User retention rate

- Average lock duration

- Successful withdrawal completion rate

---

## 2. User Personas

### 2.1 Primary Persona: The Disciplined Saver

- Age: 25-45

- Crypto-savvy but struggles with impulsive spending

- Wants to save for specific goals (vacation, emergency fund, down payment)

- Comfortable using MetaMask and web3 applications

### 2.2 Secondary Persona: The Crypto Holder

- Age: 20-35

- HODLer who wants to lock tokens to avoid panic selling

- Interested in self-custody solutions

- Values transparency and auditability

---

## 3. Functional Requirements

### 3.1 Smart Contract (Solidity)

#### 3.1.1 Core Functions

**createLock()**

- Parameters:

- `uint256 unlockTimestamp`: Unix timestamp when funds become withdrawable

- `string goalName`: User-defined name for the savings goal (max 64 characters)

- Payable: true (accepts ETH)

- Requirements:

- `msg.value > 0` (must send ETH)

- `unlockTimestamp > block.timestamp` (must be future date)

- `unlockTimestamp <= block.timestamp + 10 years` (reasonable upper limit)

- Effects:

- Creates new Lock struct with unique lockId

- Stores lock in user's lock array

- Emits `LockCreated` event

- Returns: `uint256 lockId`

**withdraw(uint256 lockId)**

- Parameters:

- `lockId`: The ID of the lock to withdraw from

- Requirements:

- Lock must exist and belong to caller

- `block.timestamp >= lock.unlockTimestamp`

- Lock must not be already withdrawn

- Effects:

- Marks lock as withdrawn

- Transfers ETH to caller

- Emits `Withdrawn` event

- Returns: `bool success`

**emergencyWithdraw(uint256 lockId)**

- Parameters:

- `lockId`: The ID of the lock to withdraw from

- Requirements:

- Lock must exist and belong to caller

- Lock must not be already withdrawn

- Emergency withdrawals enabled (contract setting)

- Effects:

- Calculates penalty (10% of locked amount)

- Marks lock as withdrawn

- Transfers (amount - penalty) to caller

- Sends penalty to contract treasury

- Emits `EmergencyWithdrawn` event

- Returns: `bool success`

**getUserLocks(address user)**

- Parameters:

- `user`: Address to query

- View function

- Returns: Array of Lock structs for the user

**getLockDetails(uint256 lockId)**

- Parameters:

- `lockId`: The lock ID to query

- View function

- Returns: Lock struct details

#### 3.1.2 Data Structures

```solidity

struct Lock {

uint256 lockId;

address owner;

uint256 amount;

uint256 createdAt;

uint256 unlockTimestamp;

string goalName;

bool withdrawn;

}

```

#### 3.1.3 State Variables

- `mapping(uint256 => Lock) public locks`: All locks by ID

- `mapping(address => uint256[]) public userLocks`: User address to lock IDs

- `uint256 public nextLockId`: Counter for lock IDs

- `uint256 public constant PENALTY_PERCENTAGE = 10`: Emergency withdrawal penalty

- `address public treasury`: Address receiving penalties

- `bool public emergencyWithdrawEnabled`: Toggle for emergency withdrawals

#### 3.1.4 Events

```solidity

event LockCreated(uint256 indexed lockId, address indexed owner, uint256 amount, uint256 unlockTimestamp, string goalName);

event Withdrawn(uint256 indexed lockId, address indexed owner, uint256 amount);

event EmergencyWithdrawn(uint256 indexed lockId, address indexed owner, uint256 amount, uint256 penalty);

```

#### 3.1.5 Security Considerations

- Implement ReentrancyGuard on withdrawal functions

- Use OpenZeppelin's security libraries

- Implement checks-effects-interactions pattern

- Add pausable functionality for emergency stops

- Include comprehensive event logging

- Validate all inputs

- Protect against integer overflow (use Solidity 0.8.x)

### 3.2 Backend (Python FastAPI + Web3.py)

#### 3.2.1 Architecture

- FastAPI for REST API endpoints

- Web3.py for blockchain interaction

- PostgreSQL for off-chain data caching

- Redis for session management and caching

- Celery for background tasks (notifications, indexing)

#### 3.2.2 API Endpoints

**POST /api/auth/nonce**

- Request: `{ "address": "0x..." }`

- Response: `{ "nonce": "random_string" }`

- Purpose: Generate nonce for signature-based authentication

**POST /api/auth/verify**

- Request: `{ "address": "0x...", "signature": "0x..." }`

- Response: `{ "token": "jwt_token", "user": {...} }`

- Purpose: Verify signature and issue JWT

**GET /api/locks**

- Headers: `Authorization: Bearer {token}`

- Query params: `?status=active|completed|all`

- Response: `{ "locks": [...], "total": 10 }`

- Purpose: Get user's locks (cached from DB, synced from chain)

**GET /api/locks/{lockId}**

- Headers: `Authorization: Bearer {token}`

- Response: `{ "lock": {...}, "timeRemaining": 86400, "canWithdraw": false }`

- Purpose: Get detailed lock information

**GET /api/stats**

- Response: `{ "totalLocks": 150, "totalValueLocked": "1234.56", "averageLockDuration": 180 }`

- Purpose: Platform statistics

**POST /api/notifications/subscribe**

- Request: `{ "lockId": 123, "email": "user@example.com", "notifyBefore": 86400 }`

- Purpose: Subscribe to unlock notifications

**GET /api/contract/gas-estimate**

- Query: `?action=createLock&amount=1000000000000000000&timestamp=1234567890`

- Response: `{ "gasEstimate": "150000", "gasPriceGwei": "50" }`

- Purpose: Estimate gas for transactions

#### 3.2.3 Database Schema

**users table**

```sql

CREATE TABLE users (

id SERIAL PRIMARY KEY,

address VARCHAR(42) UNIQUE NOT NULL,

nonce VARCHAR(255),

created_at TIMESTAMP DEFAULT NOW(),

last_login TIMESTAMP

);

```

**locks table**

```sql

CREATE TABLE locks (

lock_id BIGINT PRIMARY KEY,

owner_address VARCHAR(42) NOT NULL,

amount NUMERIC(78, 0) NOT NULL,

created_at TIMESTAMP NOT NULL,

unlock_timestamp TIMESTAMP NOT NULL,

goal_name VARCHAR(64),

withdrawn BOOLEAN DEFAULT FALSE,

withdrawn_at TIMESTAMP,

tx_hash VARCHAR(66),

FOREIGN KEY (owner_address) REFERENCES users(address)

);

CREATE INDEX idx_locks_owner ON locks(owner_address);

CREATE INDEX idx_locks_unlock ON locks(unlock_timestamp);

```

**notifications table**

```sql

CREATE TABLE notifications (

id SERIAL PRIMARY KEY,

lock_id BIGINT NOT NULL,

user_address VARCHAR(42) NOT NULL,

email VARCHAR(255),

notify_before_seconds INT DEFAULT 86400,

sent BOOLEAN DEFAULT FALSE,

sent_at TIMESTAMP,

FOREIGN KEY (lock_id) REFERENCES locks(lock_id)

);

```

#### 3.2.4 Background Tasks (Celery)

**sync_locks_task**

- Frequency: Every 5 minutes

- Purpose: Sync lock data from blockchain to database

- Process:

- Query contract events since last sync

- Update database with new locks, withdrawals

- Update lock statuses

**send_notifications_task**

- Frequency: Every hour

- Purpose: Send email notifications for upcoming unlocks

- Process:

- Query locks where `(unlock_timestamp - notify_before_seconds) <= NOW()`

- Filter unsent notifications

- Send emails via SendGrid/AWS SES

- Mark as sent

**update_stats_task**

- Frequency: Every 15 minutes

- Purpose: Calculate and cache platform statistics

- Updates Redis cache with aggregated data

#### 3.2.5 Web3.py Integration

**Contract Connection**

```python

from web3 import Web3



w3 = Web3(Web3.HTTPProvider(RPC_URL))

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

```

**Event Listening**

- Use `contract.events.LockCreated.create_filter(fromBlock='latest')`

- Process events in background task

- Store in database for quick querying

**Transaction Helpers**

- Gas estimation utilities

- Transaction status checking

- Nonce management for backend-initiated transactions (if any)

#### 3.2.6 Configuration

```python

# config.py

NETWORK = "sepolia" # or "mainnet"

RPC_URL = os.getenv("RPC_URL")

CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

DATABASE_URL = os.getenv("DATABASE_URL")

REDIS_URL = os.getenv("REDIS_URL")

JWT_SECRET = os.getenv("JWT_SECRET")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

```

### 3.3 Frontend (React Web App)

#### 3.3.1 Technology Stack

- React 18+ with TypeScript

- Vite for build tooling

- TailwindCSS for styling

- ethers.js v6 for Web3 interactions

- React Query for data fetching

- React Router for navigation

- Zustand for state management

- date-fns for date manipulation

#### 3.3.2 Pages and Components

**Home Page (`/`)**

- Hero section explaining the product

- Key features (trustless, transparent, penalty-based)

- Statistics dashboard (TVL, total locks, avg duration)

- Call-to-action: "Connect Wallet" or "View My Locks"

**Dashboard Page (`/dashboard`)**

- Requires wallet connection

- Components:

- `WalletInfo`: Display connected address, ETH balance

- `LocksList`: Grid/list of user's locks

- `CreateLockButton`: Opens modal

- `StatsCards`: User-specific stats (total locked, active locks)

**Lock Details Page (`/lock/:lockId`)**

- Components:

- `LockDetailsCard`: All lock information

- `CountdownTimer`: Visual countdown to unlock

- `WithdrawButton`: Enabled when unlocked

- `EmergencyWithdrawButton`: With penalty warning

- `LockTimeline`: Visual representation of lock duration

**Create Lock Modal**

- Form fields:

- Amount (ETH input with validation)

- Unlock date (date picker, min: tomorrow, max: 10 years)

- Goal name (text input, optional)

- Preview section showing:

- Lock duration in days

- Unlock date formatted

- Gas estimate

- Confirm button triggers MetaMask transaction

**Notifications Settings Modal**

- Email input

- "Notify me X days before unlock" slider

- Subscribe button

#### 3.3.3 Key React Components

**WalletConnect.tsx**

```typescript
// Handles MetaMask connection

// Shows connect button or connected address

// Manages wallet state in Zustand store
```

**LockCard.tsx**

```typescript
interface LockCardProps {
  lock: {
    lockId: string;

    amount: string;

    goalName: string;

    unlockTimestamp: number;

    withdrawn: boolean;
  };
}

// Displays individual lock with status badge

// Shows countdown or "Ready to withdraw"

// Links to detail page
```

**CreateLockForm.tsx**

```typescript
// Controlled form with validation

// Real-time gas estimation

// Transaction state handling (pending, success, error)
```

**WithdrawButton.tsx**

```typescript
// Handles withdraw transaction

// Shows confirmation modal

// Displays transaction status

// Updates UI on success
```

#### 3.3.4 Web3 Integration

**Wallet Connection**

```typescript
import { BrowserProvider, Contract } from "ethers";

async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not installed");

  const provider = new BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const address = await signer.getAddress();

  return { provider, signer, address };
}
```

**Contract Interaction**

```typescript
const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

// Create lock

const tx = await contract.createLock(unlockTimestamp, goalName, {
  value: parseEther(amount),
});

await tx.wait();

// Withdraw

const tx = await contract.withdraw(lockId);

await tx.wait();
```

**Event Listening**

```typescript
contract.on(
  "LockCreated",
  (lockId, owner, amount, unlockTimestamp, goalName) => {
    // Refetch user locks

    queryClient.invalidateQueries(["locks"]);
  }
);
```

#### 3.3.5 State Management (Zustand)

```typescript
interface AppState {
  wallet: {
    address: string | null;

    connected: boolean;

    balance: string;
  };

  setWallet: (wallet: Partial) => void;

  disconnect: () => void;
}
```

#### 3.3.6 UI/UX Requirements

**Responsive Design**

- Mobile-first approach

- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

- Touch-friendly buttons (min 44x44px)

**Loading States**

- Skeleton loaders for data fetching

- Spinner for transaction pending

- Progress bar for multi-step processes

**Error Handling**

- User-friendly error messages

- MetaMask error translation

- Retry mechanisms

- Toast notifications for success/error

**Accessibility**

- ARIA labels on interactive elements

- Keyboard navigation support

- Screen reader compatible

- Color contrast compliance (WCAG AA)

**Visual Design**

- Color scheme: Primary (blue), secondary (purple), accent (green for success)

- Typography: Inter or similar modern sans-serif

- Card-based layout with shadows

- Micro-interactions (hover effects, animations)

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Page load time: < 2 seconds

- Contract interaction: < 5 seconds (excluding blockchain confirmation)

- API response time: < 500ms (p95)

- Support 1000+ concurrent users

### 4.2 Security

- Smart contract audited (recommend CertiK, OpenZeppelin)

- Backend: Rate limiting, input validation, SQL injection prevention

- Frontend: XSS prevention, CSP headers

- Secure key management (never expose private keys)

- HTTPS only

### 4.3 Scalability

- Database connection pooling

- Redis caching for frequently accessed data

- CDN for frontend assets

- Horizontal scaling for backend services

### 4.4 Reliability

- 99.5% uptime target

- Graceful degradation if backend is down (read-only mode from chain)

- Database backups every 6 hours

- Monitoring and alerting (Sentry, DataDog)

---

## 5. Technical Architecture

### 5.1 System Diagram

```

┌─────────────┐

│ Browser │

│ (React) │

└──────┬──────┘

│

├─────────────────┐

│ │

▼ ▼

┌─────────────┐ ┌──────────────┐

│ MetaMask │ │ FastAPI │

│ (ethers.js)│ │ Backend │

└──────┬──────┘ └──────┬───────┘

│ │

│ ├──────────┐

│ │ │

▼ ▼ ▼

┌─────────────┐ ┌───────────┐ ┌──────┐

│ Ethereum │ │ PostgreSQL│ │Redis │

│ Network │ └───────────┘ └──────┘

│ (Smart │ ▲

│ Contract) │ │

└─────────────┘ ┌──────┴──────┐

│ Celery │

│ (Workers) │

└─────────────┘

```

### 5.2 Deployment Architecture

**Smart Contract**

- Deploy to Sepolia testnet first

- After testing, deploy to Ethereum mainnet

- Verify contract on Etherscan

**Backend**

- Deploy on AWS EC2/ECS or Heroku

- Use managed PostgreSQL (RDS/Heroku Postgres)

- Redis on AWS ElastiCache or Heroku

- Celery workers as separate processes/containers

**Frontend**

- Deploy on Vercel/Netlify

- Configure environment variables for contract address, API URL

- Enable CDN and caching

---

## 6. Development Phases

### Phase 1: Smart Contract Development (Week 1-2)

- [ ] Write Solidity contract

- [ ] Write comprehensive tests (Hardhat/Foundry)

- [ ] Deploy to local network

- [ ] Deploy to Sepolia testnet

- [ ] Verify on Etherscan

### Phase 2: Backend Development (Week 2-3)

- [ ] Setup FastAPI project structure

- [ ] Implement authentication

- [ ] Create database models and migrations

- [ ] Implement API endpoints

- [ ] Setup Web3.py contract interaction

- [ ] Implement background tasks

- [ ] Write API tests

### Phase 3: Frontend Development (Week 3-5)

- [ ] Setup React + Vite project

- [ ] Implement wallet connection

- [ ] Build dashboard and components

- [ ] Integrate with backend API

- [ ] Implement contract interactions

- [ ] Style with TailwindCSS

- [ ] Add responsive design

- [ ] Write component tests

### Phase 4: Integration & Testing (Week 5-6)

- [ ] End-to-end testing

- [ ] Security review

- [ ] Performance optimization

- [ ] Bug fixes

- [ ] User acceptance testing

### Phase 5: Deployment (Week 6-7)

- [ ] Deploy smart contract to mainnet

- [ ] Deploy backend to production

- [ ] Deploy frontend to production

- [ ] Setup monitoring

- [ ] Create documentation

### Phase 6: Post-Launch (Ongoing)

- [ ] Monitor usage and errors

- [ ] Gather user feedback

- [ ] Iterate on features

- [ ] Consider audit if TVL grows

---

## 7. Testing Strategy

### 7.1 Smart Contract Tests

- Unit tests for all functions

- Test edge cases (zero amount, past timestamp)

- Test withdrawal before unlock (should fail)

- Test emergency withdrawal logic

- Test reentrancy protection

- Gas optimization tests

### 7.2 Backend Tests

- Unit tests for business logic

- Integration tests for API endpoints

- Test database operations

- Test Web3.py interactions (mock)

- Test authentication flow

- Load testing (Locust/JMeter)

### 7.3 Frontend Tests

- Component tests (React Testing Library)

- Integration tests (Cypress/Playwright)

- Wallet connection flow

- Transaction submission

- Error handling

- Mobile responsiveness

---

## 8. Documentation Requirements

### 8.1 User Documentation

- Getting started guide

- How to create a lock

- How to withdraw

- FAQ section

- Troubleshooting common issues

### 8.2 Developer Documentation

- README with setup instructions

- API documentation (OpenAPI/Swagger)

- Smart contract documentation (NatSpec)

- Architecture diagrams

- Deployment guide

---

## 9. Future Enhancements (Out of Scope for MVP)

- Support for ERC-20 tokens

- Yield generation on locked funds (Aave/Compound integration)

- Social features (share goals, leaderboards)

- Goal tracking and milestones

- Multiple unlock schedules (vesting-like)

- Delegate unlock authority to trusted address

- Mobile app (React Native)

- Multi-sig locks (joint savings)

- Recurring deposits to existing locks

---

## 10. Risk Assessment

### 10.1 Technical Risks

- **Smart contract bugs**: Mitigate with thorough testing and audits

- **Gas price volatility**: Provide gas estimates, allow user control

- **Network congestion**: Implement retry logic, queue transactions

- **MetaMask compatibility**: Test across versions

### 10.2 Business Risks

- **Low adoption**: Marketing, clear value proposition

- **Regulatory compliance**: Consult legal expert, implement disclaimers

- **Competition**: Focus on UX and unique features

### 10.3 Security Risks

- **Contract exploit**: Professional audit, bug bounty program

- **Backend vulnerability**: Regular security scans, follow OWASP guidelines

- **Frontend attacks**: CSP, input sanitization, secure dependencies

---

## 11. Budget Estimates (Time)

### Development Time

- Smart Contract: 40 hours

- Backend: 60 hours

- Frontend: 80 hours

- Testing: 40 hours

- Deployment & DevOps: 20 hours

- **Total: ~240 hours (6 weeks for 1 developer)**

### Costs (if outsourcing/cloud)

- Smart contract audit: $5,000-$15,000 (optional for MVP)

- Cloud hosting: $50-200/month

- Domain + SSL: $20/year

- Email service: $10-30/month

- **Total operational: ~$100-250/month**

---

## 12. Appendix

### 12.1 Environment Variables

**.env.backend**

```

RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

CONTRACT_ADDRESS=0x...

DATABASE_URL=postgresql://user:pass@localhost/dbname

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key

SENDGRID_API_KEY=your-sendgrid-key

CELERY_BROKER_URL=redis://localhost:6379/0

```

**.env.frontend**

```

VITE_API_URL=http://localhost:8000

VITE_CONTRACT_ADDRESS=0x...

VITE_CHAIN_ID=11155111

```

### 12.2 Useful Resources

- Solidity Docs: https://docs.soliditylang.org/

- Web3.py Docs: https://web3py.readthedocs.io/

- FastAPI Docs: https://fastapi.tiangolo.com/

- React Docs: https://react.dev/

- ethers.js Docs: https://docs.ethers.org/v6/

- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/

### 12.3 Sample Data for Testing

**Test Lock Scenarios**

1. 7-day lock with 0.01 ETH

2. 30-day lock with 0.1 ETH

3. 1-year lock with 1 ETH

4. Emergency withdrawal after 2 weeks of 30-day lock

5. Multiple concurrent locks per user

**Test User Addresses**

- Use Hardhat local accounts for development

- Create test accounts on Sepolia with testnet ETH

---

## Document Version

- Version: 1.0

- Last Updated: January 2026

- Author: Product Team

- Status: Approved for Development
