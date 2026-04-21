# Mission Failure Fix: Dry Run Mode

## Problem
Missions were being accepted (budget validation passed), but failing during execution with errors:
```
[OnChainWalletProvider] on-chain transfer failed, aborting: 
  Recipient "arc_treasury_wallet" has no on-chain address
```

## Root Cause
The system was configured to do **real on-chain USDC transfers** to Arc testnet:
- `WALLET_PROVIDER=onchain` - Use on-chain settlement
- `ONCHAIN_DRY_RUN=false` - Actually broadcast transactions

But the internal wallets (treasury, missions) didn't have real Arc testnet addresses. They're symbolic names like:
- `arc_treasury_wallet` (treasury)
- `mission_FBL1A76M9...` (mission wallets)

The on-chain provider expected valid Ethereum-style addresses (0x...) and refused to broadcast transfers to undefined addresses.

## Solution
Temporarily enabled **dry run mode** while testing:
```bash
ONCHAIN_DRY_RUN=true
```

This allows:
- ✅ Missions to execute successfully
- ✅ Balances to update in the ledger
- ✅ Transactions recorded with settlement type `onchain-dryrun`
- ✅ No actual blockchain transfers (safe for testing)
- ✅ User's real Arc USDC balance still checked and respected

## What's Working Now
1. User has 20 USDC on Arc testnet
2. Mission form validates budget (0.00500 USDC cost)
3. Task is accepted and executed
4. Ledger settlement completes (no real transfers)
5. Mission shows as completed

## Future: Real On-Chain Settlement
To enable real on-chain transfers in the future:
1. Generate Arc testnet wallets for all agents
2. Fund them from the Arc faucet
3. Update treasury to have a real Arc testnet address
4. Set `ONCHAIN_DRY_RUN=false`

For now, this dry run mode lets you test the full mission flow with your real 20 USDC balance check working correctly!

## Files Changed
- `backend/.env` - Set `ONCHAIN_DRY_RUN=true`
