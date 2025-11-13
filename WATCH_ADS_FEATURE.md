# Watch Ads & Earn Feature

## Overview
Users can now watch Google AdMob rewarded ads to earn random token rewards (10, 20, 30, 40, 50, or 60 tokens).

## What Was Added

### 1. Backend Changes

#### New Model: `AdReward.js`
- Stores ad reward claims in MongoDB
- Fields:
  - `wallet`: User's wallet address
  - `rewardedTokens`: Amount of tokens earned
  - `claimedAt`: Timestamp of claim

#### Updated Routes: `userRoutes.js`
- **POST `/api/claim-ad-reward`**: Claims a random ad reward after watching ad
- **GET `/api/ad-rewards/:wallet`**: Gets all ad rewards for a wallet
- **Updated GET `/api/user-summary/:wallet`**: Now includes:
  - `totalEarnedSum`: Total from mining
  - `totalAdRewards`: Total from watching ads
  - `totalBalance`: Combined total (mining + ads)

### 2. Frontend Changes

#### New Screen: `WatchAdsScreen.tsx`
- Shows possible rewards (10-60 tokens)
- Loads and displays Google AdMob rewarded ads
- Handles ad watching flow
- Shows congratulations modal with earned tokens
- Automatically claims reward from backend after ad completion

#### Updated API Service: `api.ts`
- Added `claimAdReward(wallet)`: Claims ad reward
- Added `getAdRewards(wallet)`: Gets ad reward history
- Updated `UserSummary` interface to include `totalAdRewards` and `totalBalance`

#### Updated Navigation: `App.tsx`
- Added `WatchAds` screen to navigation stack

#### Updated HomeScreen: `HomeScreen.tsx`
- Added "📺 Watch Ads" button next to Leaderboard button
- Updated balance display to show `totalBalance` (mining + ads combined)
- Balance now includes both mining rewards and ad rewards

## How It Works

1. **User clicks "📺 Watch Ads" button** on HomeScreen
2. **WatchAdsScreen loads** and prepares a rewarded ad
3. **User clicks "WATCH AD & EARN"** button
4. **Google AdMob ad plays** (test ad in dev mode)
5. **After watching ad completely**, backend generates random reward (10-60 tokens)
6. **Reward is saved** to AdReward collection in MongoDB
7. **Success modal shows** the earned tokens
8. **User returns to HomeScreen** where balance is updated

## Database Structure

### AdReward Collection
```javascript
{
  _id: ObjectId,
  wallet: "0x1234...",
  rewardedTokens: 30,
  claimedAt: ISODate("2025-11-13T...")
}
```

## Total Balance Calculation

```
Total Balance = Mining Rewards + Ad Rewards
```

- **Mining Rewards**: Sum of all `totalEarned` from User collection
- **Ad Rewards**: Sum of all `rewardedTokens` from AdReward collection
- Both are aggregated and displayed on HomeScreen

## Testing

1. Start the app and navigate to HomeScreen
2. Click "📺 Watch Ads" button
3. Click "WATCH AD & EARN"
4. Watch the test ad (in dev mode)
5. See the reward modal with random tokens
6. Return to HomeScreen and see updated balance

## Notes

- Rewards are random: 10, 20, 30, 40, 50, or 60 tokens
- Each ad watch creates a new AdReward record
- No limit on how many ads can be watched
- Balance updates immediately after claiming
- Works with Google AdMob test ads in development mode
