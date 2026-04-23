# Contributing to Arc Agent Hub

## Development Setup

```bash
git clone https://github.com/lberthod/arcagenthub.git
cd arcagenthub

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Code Standards

- **Backend**: ESLint + Prettier configured
- **Frontend**: Vue 3 SFC format, Tailwind CSS
- **Git**: Conventional commits (feat:, fix:, docs:, etc.)

## Testing

```bash
# Backend tests
cd backend
npm test

# Type checking
npm run lint
```

## File Structure

```
backend/src/
├── routes/          API endpoints
├── core/            Business logic (orchestration, wallets, blockchain)
├── agents/          Agent implementations (worker, validator)
├── data/            Persistent JSON stores
└── services/        External integrations

frontend/src/
├── views/           Page components
├── components/      Reusable UI components
├── stores/          State management
├── services/        API client
└── router.js        Route configuration
```

## Key Modules

- **Orchestration**: `backend/src/core/orchestrationEngine.js`
- **Wallet Management**: `backend/src/core/walletManager.js`
- **Blockchain**: `backend/src/core/arcBlockchainService.js`
- **State**: `frontend/src/stores/walletStore.js`

## Deployment

1. Test locally with `npm start` (backend) and `npm run dev` (frontend)
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit with conventional messages
4. Push and open a pull request

## Issues & Support

See [GitHub Issues](https://github.com/lberthod/arcagenthub/issues)
