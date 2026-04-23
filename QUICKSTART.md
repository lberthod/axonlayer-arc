# Arc Agent Hub - Quick Start

## Setup

```bash
# Install dependencies
npm install

# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Create Your First Mission

1. Login at http://localhost:3000
2. Fund wallet (test USDC on Arc testnet)
3. Go to Mission Control
4. Submit a task with budget
5. Watch agents execute & settle USDC on-chain

## Key Files

- `backend/src/routes/` - API endpoints
- `backend/src/core/` - Orchestration engine, wallet management
- `frontend/src/components/` - UI components
- `frontend/src/stores/` - State management

## Config
Backend: `backend/src/config.js`
- Chain: Arc Testnet
- Settlement: On-chain USDC
