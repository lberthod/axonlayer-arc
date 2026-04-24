# Security Policy

## Reporting a Vulnerability

Please report any security issue privately by email to the maintainer
listed in `package.json`. Do **not** open a public issue.

## Secrets Policy

### Files That Must NEVER Be Committed to Git

The following files contain sensitive secrets:

| File | Contents | Risk | Action |
|------|----------|------|--------|
| `backend/.env` | API keys, Firebase config, OpenAI key | **CRITICAL** | Add to `.gitignore` |
| `backend/firebase-service-account.json` | Firebase Admin credentials | **CRITICAL** | Add to `.gitignore` |
| `backend/src/data/wallets.json` | System wallet private keys (Arc/Base) | **CRITICAL** | Add to `.gitignore` |
| `backend/src/data/users.json` | User API keys, PII | **HIGH** | Add to `.gitignore` |
| `backend/src/data/treasury.json` | Treasury state & history | **MEDIUM** | Local only, don't commit |
| `backend/src/data/providers.json` | Provider payout addresses | **HIGH** | Add to `.gitignore` |

All are covered by `.gitignore`. If detected in history:
```bash
git filter-repo --invert-paths --path <file>
# OR
bfg --delete-files <file>
```

### User Wallet Private Keys

**Important:** When users generate wallets via the `/wallet/create` endpoint:
- Private keys are stored in `backend/src/data/users.json` (user profile)
- Private keys are returned to the frontend in the API response
- **User is responsible** for securely saving their private key (write it down, use a hardware wallet, etc.)
- If a user loses their private key, their Arc USDC wallet cannot be recovered

**Best Practice:**
- Users should write down their private key on paper
- Store in a secure location (safe, hardware wallet, etc.)
- Never share with anyone
- Don't paste in browser console or untrusted websites

### System Wallets (wallets.json)

System wallets in `backend/src/data/wallets.json` are:
- **Orchestrator wallet:** `0xA89044f1d22e8CD292B3Db092C8De28eB1728d74` (treasury)
- **Worker/Validator wallets:** Pre-generated for simulation & testnet

These private keys are:
- ⚠️ **NOT for production** (same keys would be compromised across instances)
- ✅ **For testnet only** (no real USDC at risk)
- 🔒 **Must be in `.gitignore`** (never commit to GitHub)

On mainnet, use:
- Hardware wallets (Ledger, Trezor)
- Multi-sig wallets (Gnosis Safe)
- Key management services (AWS KMS, Vault)

### Treasury Address (Public Information)

The treasury address `0xA89044f1d22e8CD292B3Db092C8De28eB1728d74` is:
- ✅ **PUBLIC** — users see it and send USDC to it
- ✅ **Not a secret** — on-chain transactions are visible to everyone
- ✅ **Safe to share** — viewing balance doesn't compromise security
- ⚠️ **Private key is SECRET** — only the orchestrator should have it

## Operational guidelines

- Keep `ONCHAIN_DRY_RUN=true` until you have manually validated the full
  flow against a testnet.
- Fund only `client_wallet` at first; other wallets earn their USDC from
  the orchestrator flow.
- Rotate API keys every 90 days from the user dashboard.
- Admin accounts are provisioned solely via the `ADMIN_EMAILS` env
  allowlist. Remove an email from the list to revoke admin on next login.

## Supported versions

Only the latest `main` branch receives security patches.
