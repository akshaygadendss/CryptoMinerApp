# Mining Token Calculation Fixes

## Issues Fixed

### Issue 1: Tokens Continue After Mining Time Ends
**Problem:** When the mining timer completed, tokens continued to accumulate indefinitely until claimed.

**Root Cause:** The `multiplierElapsedSeconds` calculation in `calculate-progress` endpoint kept growing even after the total mining duration was exceeded.

**Solution:** 
- Added capping logic to ensure tokens only accumulate during the selected mining duration
- Calculate `remainingSecondsFromMultiplierStart` to determine how much time is left from when the current multiplier started
- Use `Math.min()` to cap the elapsed seconds to not exceed the total mining duration

```javascript
const remainingSecondsFromMultiplierStart = totalSeconds - Math.floor((multiplierStartTime - startTime) / 1000);
const cappedMultiplierElapsedSeconds = Math.min(multiplierElapsedSeconds, remainingSecondsFromMultiplierStart);
const newPoints = cappedMultiplierElapsedSeconds * tokensPerSecond;
```

### Issue 2: Mining Rate Not Synced with Backend Config
**Problem:** The mining rate was hardcoded as `user.multiplier * 0.01` instead of fetching from the backend Config collection.

**Root Cause:** The backend endpoints were not reading the `MINING_RATES` config from the database.

**Solution:**
- Modified both `calculate-progress` and `upgrade-multiplier` endpoints to fetch mining rates from Config
- Use the rate from config: `miningRates[user.multiplier]?.rate`
- Fallback to calculated rate if config is not available: `user.multiplier * 0.01`

```javascript
// Fetch mining rates from config
const miningRatesConfig = await Config.findOne({ key: 'MINING_RATES' });
const miningRates = miningRatesConfig ? miningRatesConfig.value : {
  1: { rate: 0.0100, hourlyReward: 36.00 },
  2: { rate: 0.0200, hourlyReward: 72.00 },
  3: { rate: 0.0300, hourlyReward: 108.00 },
  4: { rate: 0.0400, hourlyReward: 144.00 },
  5: { rate: 0.0500, hourlyReward: 180.00 },
  6: { rate: 0.0600, hourlyReward: 216.00 },
};

const tokensPerSecond = miningRates[user.multiplier]?.rate || (user.multiplier * 0.01);
```

## Changes Made

### File: `backend/routes/userRoutes.js`

#### 1. Updated `/calculate-progress` endpoint:
- Fetches `MINING_RATES` from Config collection
- Uses config rate instead of hardcoded calculation
- Caps token accumulation to the selected mining duration
- Ensures tokens stop accumulating once mining time is complete

#### 2. Updated `/upgrade-multiplier` endpoint:
- Fetches `MINING_RATES` from Config collection
- Uses config rate for recalculating points when upgrading
- Caps the elapsed time calculation to not exceed total mining duration
- Ensures accurate token calculation during multiplier upgrades

## Expected Behavior After Fix

### 1 Hour Mining at 1× Multiplier:
- **Rate:** 0.01 tokens/second (from config)
- **Duration:** 3600 seconds
- **Expected Tokens:** 36 tokens (0.01 × 3600)
- **Behavior:** Tokens accumulate for exactly 1 hour, then stop

### 2 Hour Mining at 2× Multiplier:
- **Rate:** 0.02 tokens/second (from config)
- **Duration:** 7200 seconds
- **Expected Tokens:** 144 tokens (0.02 × 7200)
- **Behavior:** Tokens accumulate for exactly 2 hours, then stop

### Multiplier Upgrade During Mining:
- Points earned with old multiplier are calculated and saved
- New multiplier starts from the upgrade time
- Total tokens = (time with old multiplier × old rate) + (time with new multiplier × new rate)
- All calculations respect the total mining duration cap

## Testing

To verify the fixes:

1. **Test Token Calculation:**
   - Start 1 hour mining at 1× multiplier
   - Wait for completion
   - Should receive exactly 36 tokens (or the rate configured in backend)

2. **Test Time Cap:**
   - Start mining
   - Wait for timer to complete
   - Verify tokens stop accumulating after the selected duration
   - Tokens should not increase while in "ready_to_claim" status

3. **Test Config Sync:**
   - Update `MINING_RATES` in backend Config collection
   - Start new mining session
   - Verify tokens accumulate at the new rate

4. **Test Multiplier Upgrade:**
   - Start mining at 1×
   - Upgrade to 2× after some time
   - Verify points are correctly calculated for both periods
   - Total should not exceed: (duration × rate)

## Notes

- All existing functionality remains unchanged
- The fixes are backward compatible
- Frontend doesn't need any changes - it already fetches rates from backend
- The system now properly respects both time limits and config rates
