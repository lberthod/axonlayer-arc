# Arc Blockchain Integration - Debugging Guide

## Problem: Balance Not Showing Up

If you don't see USDC balance in the frontend but have funds on Arc testnet, follow this guide.

## Step 1: Check Backend Logs

Start the backend and look for blockchain initialization messages:

```bash
cd backend
npm run dev
```

Look for these log lines:
```
[Arc Blockchain] Initializing provider with RPC: https://testnet-rpc.arc.io
[Arc Blockchain] Provider initialized successfully
[Arc Blockchain] USDC Contract: 0x3600000000000000000000000000000000000000
```

If you see errors, it means the RPC endpoint or contract address is wrong.

## Step 2: Check Blockchain Status Endpoint

Open a new terminal and check if the backend can connect to Arc:

```bash
curl http://localhost:3001/api/auth/blockchain/status
```

You should see:
```json
{
  "connected": true,
  "network": {
    "name": "Arc Testnet",
    "chainId": 6699
  },
  "blockNumber": 12345678,
  "rpc": "https://testnet-rpc.arc.io",
  "usdcContract": "0x3600000000000000000000000000000000000000",
  "providerInitialized": true,
  "contractInitialized": true
}
```

If `connected: false`, the RPC endpoint is unreachable.

## Step 3: Check Debug Info

Get detailed debug information:

```bash
curl http://localhost:3001/api/auth/blockchain/debug
```

This shows:
- Provider status
- Contract status
- Network info
- Latest block number

## Step 4: Check Backend Environment Variables

Verify your `.env` file has:

```bash
# In backend/.env
ARC_TESTNET_RPC=https://testnet-rpc.arc.io
ARC_USDC_CONTRACT=0x3600000000000000000000000000000000000000
```

If missing, add them and restart the backend:

```bash
npm run dev
```

## Step 5: Verify Wallet Address Format

Check that your wallet address is valid:

```bash
# Should be: 0x + 40 hex characters
# Example: 0x1234567890123456789012345678901234567890

# Get your wallet from frontend: Profile page
# Copy it and verify format
```

## Step 6: Check Balance Directly

Test balance query with curl:

```bash
# Replace WITH_YOUR_ADDRESS with your actual wallet address
curl http://localhost:3001/api/auth/wallet/balance/0x1234567890123456789012345678901234567890
```

You should see:
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "balance": 1.5,
  "currency": "USDC",
  "network": "arc-testnet"
}
```

If balance is 0, either:
1. You haven't sent USDC to this address on Arc testnet
2. The contract address is wrong
3. The RPC endpoint is not working

## Step 7: Verify Arc Testnet Funds

1. Go to [Arc Testnet Explorer](https://testnet-explorer.arc.io)
2. Search for your wallet address
3. Look for USDC transfers

If you see transactions but balance shows 0:
- The RPC endpoint might be out of sync
- The USDC contract address might be different on Arc testnet

## Possible Issues & Solutions

### Issue 1: "Provider not initialized"
**Cause**: RPC endpoint unreachable
**Fix**: 
- Check `ARC_TESTNET_RPC` in `.env`
- Verify endpoint is accessible: `curl https://testnet-rpc.arc.io`
- Try alternative RPC: `https://rpc.testnet.arc.network`

### Issue 2: "USDC contract not initialized"
**Cause**: Provider initialized but contract creation failed
**Fix**:
- Verify `ARC_USDC_CONTRACT` address is correct
- Check the address exists on Arc testnet
- Restart backend after changing `.env`

### Issue 3: Balance shows 0 but have funds on-chain
**Cause**: RPC/contract mismatch or wrong address
**Fix**:
- Double-check wallet address format (0x + 40 hex)
- Check Arc testnet explorer for actual transactions
- Verify USDC contract address with Arc docs
- Try different RPC endpoint

### Issue 4: Connection timeout
**Cause**: RPC endpoint is slow or unreachable
**Fix**:
- Check internet connection
- Try alternative RPC endpoint
- Increase timeout in `arcBlockchainService.js` if needed

## Arc Testnet Information

**Network Name**: Arc Testnet  
**Chain ID**: 6699  
**RPC Endpoints**:
- https://testnet-rpc.arc.io (primary)
- https://rpc.testnet.arc.network (alternative)

**USDC Contract Address**: 0x3600000000000000000000000000000000000000  
**Network Explorer**: https://testnet-explorer.arc.io  
**Faucet**: https://testnet-faucet.arc.io

## Getting Test USDC

1. Go to [Arc Faucet](https://testnet-faucet.arc.io)
2. Connect your wallet
3. Request USDC (usually 10 USDC for testing)
4. Wait for transaction confirmation
5. Return to Arc Agent Hub and check balance

## Check Balance Logs

When checking balance, backend logs should show:

```
[Arc Blockchain] Querying balance for address: 0x...
[Arc Blockchain] Connected to chain, current block: 12345678
[Arc Blockchain] Querying USDC contract at 0x3600000000000000000000000000000000000000
[Arc Blockchain] Raw balance response: 1500000000
[Arc Blockchain] Converted balance: 1.5 USDC
```

If you see errors here, the issue is in the blockchain call.

## Frontend Debugging

Open browser console (F12) and look for network requests to:
- `GET /api/auth/me` - Should return balance
- `GET /api/auth/wallet/balance/0x...` - Direct balance query
- Check response body for balance value

## Still Not Working?

1. Check backend logs for errors
2. Run debug endpoint: `/api/auth/blockchain/debug`
3. Verify Arc testnet has your USDC (explorer)
4. Try different RPC endpoint
5. Restart both backend and frontend
6. Clear browser cache (Ctrl+Shift+Delete)

## Support

For Arc testnet issues:
- Arc Documentation: https://docs.arc.io
- Discord: [Arc Community](https://discord.gg/arc)

For Arc Agent Hub issues:
- GitHub Issues: https://github.com/lberthod/arcagenthub/issues
