# Security Policy

## Reporting a Vulnerability

Please report any security issue privately by email to the maintainer
listed in `package.json`. Do **not** open a public issue.

## Secrets policy

The following files MUST NEVER be committed to git:

- `backend/.env` / `frontend/.env` — API keys, Firebase config, OpenAI key
- `backend/firebase-service-account.json` — Firebase Admin credentials
- `backend/src/data/wallets.json` — real EOA private keys (Arc / Base)
- `backend/src/data/users.json` — user API keys, PII
- `backend/src/data/providers.json` — provider payout addresses

They are all covered by the repo `.gitignore`. If you detect one of them
in git history, rotate the secret immediately and rewrite history with
`git filter-repo` or `bfg`.

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
