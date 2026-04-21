# Mission Budget Validation Fix

## Problem
User had 20 USDC on Arc testnet, but mission form rejected task submission with error:
```
Estimated cost 0.00500 USDC exceeds your budget 0.00000
```

## Root Cause
1. **Frontend**: `MissionForm.vue` didn't emit the `budget` value in the submit event
   - Only emitted: `input`, `taskType`, `selectionStrategy`
   - Missing: `budget`
   - Result: `budget = undefined` in `handleMissionSubmit`, defaulted to 0

2. **Frontend**: `MissionForm.vue` didn't show available wallet balance
   - Users had no visibility into how much they could spend
   - Made it impossible to determine the correct budget

3. **Backend**: Task validation checked `req.user.missionWallet.balance` (simulated balance)
   - Not the real on-chain balance from Arc testnet
   - User had 0 simulated balance, but 20 USDC on-chain

## Solutions Implemented

### 1. Frontend: MissionForm.vue
```javascript
// ✅ NOW: Include budget in submit event
emit('submit', {
  input: goal.value,
  taskType: missionType.value,
  selectionStrategy: strategyFor[optimize.value],
  budget: budget.value  // <-- ADDED
});
```

### 2. Frontend: MissionForm.vue  
```vue
<!-- ✅ Display available wallet balance -->
<span v-if="props.availableBalance > 0" class="block text-xs text-violet-600 mt-1">
  Available: {{ props.availableBalance.toFixed(6) }} USDC
</span>

<!-- ✅ Prevent budget from exceeding available balance -->
<input
  v-model.number="budget"
  type="number"
  :max="props.availableBalance || undefined"
  step="0.0001"
/>

<!-- ✅ Filter preset buttons to available balance -->
<button
  v-for="b in presets.filter(p => p <= (props.availableBalance || Infinity))"
  ...
>{{ b }}</button>
```

### 3. Frontend: MissionControlView.vue
```javascript
// ✅ Pass available wallet balance to form
<MissionForm
  ref="missionFormRef"
  :available-balance="availableBalance"  // <-- ADDED
  @submit="handleMissionSubmit"
  @budget-change="(v) => liveBudget = v"
/>
```

```javascript
// ✅ Validate budget against available balance
async function handleMissionSubmit({ input, taskType, selectionStrategy, budget }) {
  const submittedBudget = Number(budget) || 0;
  
  // Check budget doesn't exceed available balance
  if (submittedBudget > missionWalletBalance.value) {
    toastError(
      new Error(`Budget ${submittedBudget.toFixed(5)} USDC exceeds available balance...`),
      'Insufficient wallet balance'
    );
    return;
  }
  
  // Then check if estimated cost exceeds submitted budget
  const est = Number(quote?.pricing?.clientPayment || 0);
  if (est > 0 && est > submittedBudget) {
    toastError(
      new Error(`Estimated cost ${est.toFixed(5)} USDC exceeds your budget...`),
      'Budget too low'
    );
    return;
  }
}
```

### 4. Backend: tasks.routes.js
```javascript
// ✅ Import blockchain service
import arcBlockchain from '../core/arcBlockchainService.js';

// ✅ Fetch real on-chain balance before validating
if (req.user) {
  let userBalance = 0;
  if (req.user.wallet?.address) {
    try {
      userBalance = await arcBlockchain.getBalance(req.user.wallet.address);
    } catch (err) {
      // Fallback to stored balance if blockchain call fails
      userBalance = req.user.balance || 0;
    }
  }

  if (userBalance < quote.clientPayment) {
    throw badRequest('insufficient_balance', 'mission wallet cannot afford this task', {
      required: quote.clientPayment,
      available: userBalance
    });
  }
}
```

## Result
✅ User with 20 USDC on Arc testnet can now:
- See available balance in mission form (20.000000 USDC)
- Set budget up to 20 USDC
- Submit missions with 0.00500 USDC estimated cost
- Backend validates against real on-chain balance

## Testing
1. Wallet shows 20 USDC (verified from Arc testnet explorer)
2. Mission form displays "Available: 20.000000 USDC"
3. Budget input allows values up to 20 USDC
4. Preset buttons (0.005, 0.01, 0.05) all available
5. Task submission validates correctly against 20 USDC balance
6. Mission can be launched successfully

## Files Changed
- `frontend/src/components/MissionForm.vue`
- `frontend/src/views/MissionControlView.vue`
- `backend/src/routes/tasks.routes.js`
