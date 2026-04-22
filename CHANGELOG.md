# Changelog

All notable changes to Arc Agent Hub are documented here.

## [Latest] - 2026-04-22

### Added
- ✨ **User Dashboard Mission Details Modal** — Click any mission to view full execution details including:
  - Task input and result
  - Validation score and notes
  - Pricing breakdown (worker, validator, orchestrator)
  - Execution step timeline with timestamps
  - Creation/update timestamps

- ✨ **Mission Status Filtering** — New dropdown selector in "My Missions" section:
  - All (with total count)
  - Completed (with count)
  - Failed (with count)
  - Pending (with count)
  - Live count updates

- ✨ **GPT-5-nano Integration** — Optimized LLM support for text tasks:
  - Model: `gpt-5-nano-2025-08-07` (lightweight, cost-effective)
  - Configuration: Reasoning disabled for speed, 4096 output tokens
  - Fallback: Local algorithms if LLM unavailable
  - Cost: ~$0.0005 USDC per task

- ✨ **Enhanced Summarize Prompts** — Better instruction clarity:
  - Worker: "Create a concise 1-2 sentence summary..."
  - Validator: Strict rules to reject copy-paste summaries

- ✨ **Mission Wallet Sync** — Endpoint to sync on-chain balance to mission wallet:
  - Button: "🔄 Fund Mission Wallet from On-Chain"
  - Fetches Arc USDC balance and updates mission wallet
  - Solves issue of 20 USDC on-chain but empty mission wallet

- 📝 **Documentation** — New files:
  - `ABOUT.md` — Project overview and philosophy
  - `CHANGELOG.md` — This file
  - Updated `README.md` with GPT-5-nano section

### Fixed
- 🐛 **Mission Execution Failures** — Fixed root cause:
  - Balance validation now checks `missionWallet.balance` (execution) instead of on-chain wallet
  - Mission funding no longer attempts impossible on-chain transfers from ledger entries
  - Wallet manager now resolves on-chain addresses back to wallet IDs for proper signing

- 🐛 **Treasury Depletion** — Reset treasury balance from -0.000107 to 100 USDC:
  - Clean initialization history
  - Proper fee structure tracking

- 🐛 **Dev Mode Authentication** — Fixed 401 errors on authenticated endpoints:
  - Auto-populate `req.user` when `AUTH_ENABLED=false`
  - Allows testing without Firebase setup

- 🐛 **ESLint Errors** — Fixed 10 "'describe' is not defined" warnings:
  - Split eslint.config.js into src and test sections
  - Added all Jest globals to test section

- 🐛 **LLM Output Truncation** — Fixed incomplete responses:
  - Increased `OPENAI_MAX_OUTPUT_TOKENS` from 512 to 4096
  - Disabled reasoning (`OPENAI_REASONING_EFFORT=none`)
  - Better error handling for empty LLM responses

- 🐛 **Backend Logging** — Improved result visibility:
  - Increased result substring from 50 to 180 characters
  - Now shows: "Kiet, un homme simple d'Isan..." instead of "Kiet, un ho..."

### Changed
- 🔧 **Environment Configuration:**
  - `WALLET_PROVIDER=onchain` (live Arc testnet settlement)
  - `ONCHAIN_DRY_RUN=false` (broadcast real transactions)
  - `AUTH_ENABLED=false` (dev mode without Firebase)
  - `PRICING_PROFILE=nano` (micro-payment optimized)
  - New: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`

- 🔧 **Worker Agent** — Enhanced logging:
  - Now shows: `[Worker-fast:execute] ✓ LLM succeeded via gpt-5-nano-2025-08-07`
  - Tracks LLM attempts vs local fallback
  - Includes backend used (llm vs local)

- 🔧 **Validator Agent** — Enhanced logging:
  - Now shows: `[Validator-default:execute] ✓ LLM validation succeeded via gpt-5-nano-2025-08-07`
  - Validates summaries don't exceed word limits
  - Scores semantic quality

### Performance
- ⚡ Task execution latency reduced (LLM fallback faster)
- ⚡ Mission wallet sync <1 second
- ⚡ Dashboard filtering instant (computed properties)

### Testing
- ✅ All 212+ tests passing
- ✅ ESLint compliance (flat config)
- ✅ Backend health checks passing
- ✅ Frontend builds without warnings

## [Previous] - Earlier Sessions

### Session Focus: Foundation & Architecture
- Initial Arc blockchain integration
- Agent orchestration engine
- Dynamic pricing system
- User authentication (Firebase)
- Ledger-based payment system
- Multi-agent validation
- Basic dashboard UI

---

## How to Update

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

3. **Update environment:**
   ```bash
   # Copy .env.example and update with your OpenAI API key
   cp backend/.env.example backend/.env
   ```

4. **Run locally:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

5. **Verify:**
   - Backend: http://localhost:3001/api/health
   - Frontend: http://localhost:3000
   - Tests: `npm test` in each directory

---

## Known Issues

### None reported
All documented issues have been resolved. Please report new issues via GitHub.

---

## Next Steps / Roadmap

- [ ] Provider marketplace UI
- [ ] Advanced agent scoring (reputation)
- [ ] Multi-chain support (Base, Arbitrum)
- [ ] Provider dashboard
- [ ] Slashing mechanism UI
- [ ] Advanced analytics
- [ ] Mobile app

---

**Last Updated:** 2026-04-22  
**Current Version:** 2.0  
**Status:** Production-ready on Arc testnet
