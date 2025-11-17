# Referral Mining Revenue Sharing Implementation

## Overview
Implemented a 10% referral reward system where referrers earn 10% of the tokens mined by users they referred, in addition to the existing 200 token signup bonus.

## Changes Made

### 1. New Database Model
**File:** `backend/models/ReferralMiningReward.js`
- Created new collection to track mining-based referral rewards
- Fields:
  - `referrerWallet`: Wallet address of the referrer
  - `referredWallet`: Wallet address of the referred user
  - `session10percentTokens`: 10% of tokens from the mining session
  - `claimedAt`: Timestamp when the reward was given

### 2. Backend API Updates
**File:** `backend/routes/userRoutes.js`

#### Modified `/claim-reward` endpoint:
- When a user claims mining rewards, the system now:
  1. Checks if the user was referred by someone
  2. Calculates 10% of the claimed tokens
  3. Creates a `ReferralMiningReward` record
  4. Adds the 10% reward to the referrer's balance via `AdReward` collection
  5. The referred user still gets 100% of their mined tokens

#### Added new endpoint `/referral-mining-rewards/:wallet`:
- Returns all mining-based referral rewards for a wallet
- Includes total mining rewards and count
- Used for displaying notifications

### 3. Frontend API Service
**File:** `src/services/api.ts`
- Added `getReferralMiningRewards()` method to fetch mining-based referral rewards

### 4. Notifications Screen Updates
**File:** `src/screens/NotificationsScreen.tsx`

#### Enhanced notification types:
- **Signup Notifications** (🎁): 200 tokens when someone uses your referral code
- **Mining Notifications** (⛏️): 10% of tokens when referred users complete mining sessions

#### Features:
- Combined display of both notification types
- Sorted by date (most recent first)
- Shows total referral rewards (signup + mining)
- Different icons and colors for each type
- Displays exact token amounts with 4 decimal precision for mining rewards

## How It Works

### User Flow:
1. **Yash uses Akshay's referral code**
   - Akshay immediately gets 200 tokens (existing feature)

2. **Yash starts mining and claims tokens**
   - Yash gets 100% of his mined tokens (e.g., 100 tokens)
   - Akshay automatically gets 10% (e.g., 10 tokens)
   - A notification appears on Akshay's notification screen
   - The 10% is added to Akshay's total balance

3. **Akshay's Balance Updates**
   - Total balance = Mining earnings + Ad rewards + Referral signup bonuses + Mining referral rewards (10%)
   - All rewards are tracked separately but combined in the total balance

### Database Collections:
- `Referral`: Tracks initial referral relationships (200 token signup bonus)
- `ReferralMiningReward`: Tracks 10% rewards from mining sessions
- `AdReward`: Stores all token rewards (ads, referrals, mining bonuses)
- `User`: Tracks mining sessions and earned tokens

## Testing
To test the implementation:
1. Create two users (Yash and Akshay)
2. Have Yash apply Akshay's referral code
3. Have Yash start and complete a mining session
4. Claim the mining rewards as Yash
5. Check Akshay's notifications - should see a mining reward notification
6. Check Akshay's total balance - should include the 10% bonus

## Notes
- The referred user (Yash) always gets 100% of their mined tokens
- The referrer (Akshay) gets an additional 10% as a bonus
- All existing functionality remains unchanged
- The system is fully backward compatible
