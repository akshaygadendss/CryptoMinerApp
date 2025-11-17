import express from 'express';
import User from '../models/User.js';
import MinerUser from '../models/MinerUser.js';
import Config from '../models/Config.js';
import AdReward from '../models/AdReward.js';
import Referral from '../models/Referral.js';
import ReferralMiningReward from '../models/ReferralMiningReward.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    console.log('[SIGNUP] Request received:', req.body);
    const { wallet } = req.body;
    
    if (!wallet || wallet.trim() === '') {
      console.log('[SIGNUP] Error: Wallet address is required');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log('[SIGNUP] Checking if user exists:', wallet.trim());
    let user = await User.findOne({ wallet: wallet.trim() });
    let minerUser = await MinerUser.findOne({ walletId: wallet.trim() });
    
    if (user && minerUser) {
      console.log('[SIGNUP] User already exists:', user._id);
      return res.status(200).json({ 
        message: 'User already exists', 
        user,
        minerUser
      });
    }

    console.log('[SIGNUP] Creating new user...');
    user = new User({ wallet: wallet.trim() });
    await user.save();
    console.log('[SIGNUP] User created successfully:', user._id);

    // Create MinerUser entry
    console.log('[SIGNUP] Creating MinerUser entry...');
    minerUser = new MinerUser({ walletId: wallet.trim() });
    await minerUser.save();
    console.log('[SIGNUP] MinerUser created successfully:', minerUser._id);

    res.status(201).json({ 
      message: 'User created successfully', 
      user,
      minerUser
    });
  } catch (error) {
    console.error('[SIGNUP] Error:', error.message);
    console.error('[SIGNUP] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    // Prioritize active sessions (mining or ready_to_claim), then fall back to most recent
    let user = await User.findOne({ 
      wallet, 
      status: { $in: ['mining', 'ready_to_claim'] } 
    }).sort({ lastUpdated: -1, createdDate: -1 });

    if (!user) {
      // Fall back to most recent session if no active session
      user = await User.findOne({ wallet }).sort({ createdDate: -1, lastUpdated: -1 });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary for a wallet: total earned across sessions and latest session
router.get('/user-summary/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    // Sum totalEarned across all claimed sessions
    const aggregation = await User.aggregate([
      { $match: { wallet } },
      {
        $group: {
          _id: '$wallet',
          totalEarnedSum: { $sum: '$totalEarned' }
        }
      }
    ]);

    

    const totalEarnedSum = aggregation.length > 0 ? aggregation[0].totalEarnedSum : 0;

    // Sum total ad rewards
    const adRewardAggregation = await AdReward.aggregate([
      { $match: { wallet } },
      {
        $group: {
          _id: '$wallet',
          totalAdRewards: { $sum: '$rewardedTokens' }
        }
      }
    ]);

    const totalAdRewards = adRewardAggregation.length > 0 ? adRewardAggregation[0].totalAdRewards : 0;

    const latestSession = await User.findOne({ wallet }).sort({ createdDate: -1, lastUpdated: -1 });

    // Calculate total balance
    const totalBalance = totalEarnedSum + totalAdRewards;

    res.status(200).json({
      wallet,
      totalEarnedSum,
      totalAdRewards,
      totalBalance,
      latestSession
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/start-mining', async (req, res) => {
  try {
    console.log('[START-MINING] Request received:', req.body);
    const { wallet, selectedHour, multiplier } = req.body;

    console.log('[START-MINING] Finding user:', wallet);
    // Prevent starting a new session if there is an active one
    const activeSession = await User.findOne({ 
      wallet, 
      status: { $in: ['mining', 'ready_to_claim'] } 
    }).sort({ lastUpdated: -1 });

    if (activeSession) {
      console.log('[START-MINING] Active session already exists for wallet:', wallet, 'Status:', activeSession.status);
      if (activeSession.status === 'ready_to_claim') {
        return res.status(400).json({ 
          error: 'Please claim your previous mining rewards before starting a new session.',
          status: 'ready_to_claim'
        });
      }
      return res.status(400).json({ 
        error: 'An active mining session is already in progress.',
        status: activeSession.status
      });
    }

    // Ensure wallet is registered in MinerUser
    const minerUser = await MinerUser.findOne({ walletId: wallet });
    if (!minerUser) {
      console.log('[START-MINING] MinerUser not found for wallet:', wallet);
      return res.status(404).json({ error: 'User not registered' });
    }

    console.log('[START-MINING] Creating new mining session document...');
    const now = new Date();

    const session = new User({
      wallet,
      createdDate: now,
      status: 'mining',
      miningStartTime: now,
      currentMultiplierStartTime: now,
      selectedHour: selectedHour || 1,
      multiplier: multiplier || 1,
      currentMiningPoints: 0,
      totalEarned: 0,
      lastUpdated: now
    });

    await session.save();
    console.log('[START-MINING] Mining session created successfully:', session._id);

    res.status(200).json({ 
      message: 'Mining started successfully', 
      user: session 
    });
  } catch (error) {
    console.error('[START-MINING] Error:', error.message);
    console.error('[START-MINING] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.post('/calculate-progress', async (req, res) => {
  try {
    const { wallet } = req.body;

    // Prefer the latest active session; otherwise, fall back to the latest session
    let user = await User.findOne({ wallet, status: { $in: ['mining', 'ready_to_claim'] } })
      .sort({ lastUpdated: -1, createdDate: -1 });

    if (!user) {
      user = await User.findOne({ wallet }).sort({ createdDate: -1, lastUpdated: -1 });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'mining') {
      return res.status(200).json({ 
        currentPoints: user.currentMiningPoints,
        timeElapsed: 0,
        timeRemaining: 0,
        progress: 0,
        isComplete: user.status === 'ready_to_claim'
      });
    }

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

    const startTime = new Date(user.miningStartTime);
    const multiplierStartTime = new Date(user.currentMultiplierStartTime);
    const now = new Date();
    
    // Calculate total elapsed time from mining start
    const totalElapsedSeconds = Math.floor((now - startTime) / 1000);
    const totalSeconds = user.selectedHour * 3600;
    
    // Get tokens per second from config
    const tokensPerSecond = miningRates[user.multiplier]?.rate || (user.multiplier * 0.01);
    
    // Calculate points earned with current multiplier
    // IMPORTANT: Cap the multiplier elapsed time to not exceed total mining duration
    const multiplierElapsedSeconds = Math.floor((now - multiplierStartTime) / 1000);
    const remainingSecondsFromMultiplierStart = totalSeconds - Math.floor((multiplierStartTime - startTime) / 1000);
    const cappedMultiplierElapsedSeconds = Math.min(multiplierElapsedSeconds, remainingSecondsFromMultiplierStart);
    
    const newPoints = cappedMultiplierElapsedSeconds * tokensPerSecond;
    
    // Total points = previously earned + new points with current multiplier
    let currentPoints = user.currentMiningPoints + newPoints;
    let timeRemaining = Math.max(0, totalSeconds - totalElapsedSeconds);
    let progress = Math.min(100, (totalElapsedSeconds / totalSeconds) * 100);

    if (totalElapsedSeconds >= totalSeconds) {
      // Mining complete - save final points and change status
      user.currentMiningPoints = currentPoints;
      user.status = 'ready_to_claim';
      user.lastUpdated = new Date();
      await user.save();

      return res.status(200).json({
        currentPoints,
        timeElapsed: totalSeconds,
        timeRemaining: 0,
        progress: 100,
        isComplete: true
      });
    }

    res.status(200).json({
      currentPoints,
      timeElapsed: totalElapsedSeconds,
      timeRemaining,
      progress,
      isComplete: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/claim-reward', async (req, res) => {
  try {
    const { wallet } = req.body;

    const user = await User.findOne({ wallet, status: 'ready_to_claim' }).sort({ lastUpdated: -1 });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If not ready_to_claim, no rewards to claim
    // (findOne above already filters, but leave guard if logic changes)
    if (user.status !== 'ready_to_claim') {
      return res.status(400).json({ error: 'No rewards to claim' });
    }

    const claimedTokens = user.currentMiningPoints;
    user.totalEarned += claimedTokens;
    user.currentMiningPoints = 0;
    user.status = 'claimed';
    user.lastUpdated = new Date();

    await user.save();

    // Check if this user was referred by someone
    const referral = await Referral.findOne({ referredWallet: wallet });
    
    if (referral) {
      // Calculate 10% of the claimed tokens for the referrer
      const referrerReward = claimedTokens * 0.1;
      
      // Create a referral mining reward record
      const miningReward = new ReferralMiningReward({
        referrerWallet: referral.referrerWallet,
        referredWallet: wallet,
        session10percentTokens: referrerReward,
        claimedAt: new Date()
      });
      
      await miningReward.save();
      
      // Add the 10% reward to the referrer's balance via AdReward collection
      const adReward = new AdReward({
        wallet: referral.referrerWallet,
        rewardedTokens: referrerReward,
        claimedAt: new Date()
      });
      
      await adReward.save();
      
      console.log('[CLAIM-REWARD] Referrer reward added:', {
        referrer: referral.referrerWallet,
        referred: wallet,
        reward: referrerReward
      });
    }

    res.status(200).json({ 
      message: 'Reward claimed successfully', 
      user,
      totalEarned: user.totalEarned
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade multiplier (sequential progression only)
router.post('/upgrade-multiplier', async (req, res) => {
  try {
    console.log('[UPGRADE-MULTIPLIER] Request received:', req.body);
    const { wallet, newMultiplier } = req.body;

    if (!wallet || !newMultiplier) {
      return res.status(400).json({ error: 'Wallet and newMultiplier are required' });
    }

    // Check if user is registered
    const minerUser = await MinerUser.findOne({ walletId: wallet });
    if (!minerUser) {
      console.log('[UPGRADE-MULTIPLIER] MinerUser not found:', wallet);
      return res.status(404).json({ error: 'User not registered' });
    }

    // Find the latest active mining session
    const user = await User.findOne({ 
      wallet, 
      status: { $in: ['mining', 'ready_to_claim'] } 
    }).sort({ lastUpdated: -1 });

    if (!user) {
      console.log('[UPGRADE-MULTIPLIER] No active mining session found:', wallet);
      return res.status(400).json({ 
        error: 'No active mining session',
        message: 'Please start a mining session before upgrading multiplier'
      });
    }

    const currentMultiplier = user.multiplier || 1;
    
    // Validate sequential progression: can only upgrade to next level
    if (newMultiplier !== currentMultiplier + 1) {
      console.log('[UPGRADE-MULTIPLIER] Invalid upgrade:', { 
        current: currentMultiplier, 
        requested: newMultiplier 
      });
      return res.status(400).json({ 
        error: 'Invalid multiplier upgrade',
        message: `You can only upgrade from ${currentMultiplier}× to ${currentMultiplier + 1}×`,
        currentMultiplier,
        allowedMultiplier: currentMultiplier + 1
      });
    }

    // Check max multiplier limit
    if (newMultiplier > 6) {
      return res.status(400).json({ 
        error: 'Maximum multiplier reached',
        message: 'Maximum multiplier is 6×'
      });
    }

    console.log('[UPGRADE-MULTIPLIER] Upgrading multiplier:', {
      from: currentMultiplier,
      to: newMultiplier
    });

    // If user is currently mining, recalculate points with old multiplier
    if (user.status === 'mining') {
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

      const now = new Date();
      const startTime = new Date(user.miningStartTime);
      const multiplierStartTime = new Date(user.currentMultiplierStartTime);
      const totalSeconds = user.selectedHour * 3600;
      
      // Calculate elapsed time with current multiplier
      const elapsedSeconds = Math.floor((now - multiplierStartTime) / 1000);
      
      // Cap elapsed time to not exceed total mining duration
      const remainingSecondsFromMultiplierStart = totalSeconds - Math.floor((multiplierStartTime - startTime) / 1000);
      const cappedElapsedSeconds = Math.min(elapsedSeconds, remainingSecondsFromMultiplierStart);
      
      // Get tokens per second from config
      const tokensPerSecond = miningRates[currentMultiplier]?.rate || (currentMultiplier * 0.01);
      const pointsEarned = cappedElapsedSeconds * tokensPerSecond;
      
      // Add points earned with old multiplier
      user.currentMiningPoints += pointsEarned;
      
      // Reset multiplier start time for new multiplier
      user.currentMultiplierStartTime = now;
      
      console.log('[UPGRADE-MULTIPLIER] Recalculated points during mining:', {
        elapsedSeconds: cappedElapsedSeconds,
        pointsEarned,
        totalPoints: user.currentMiningPoints
      });
    }

    // Upgrade the multiplier
    user.multiplier = newMultiplier;
    user.lastUpdated = new Date();

    await user.save();
    console.log('[UPGRADE-MULTIPLIER] Multiplier upgraded successfully:', user._id);

    res.status(200).json({ 
      message: 'Multiplier upgraded successfully',
      user,
      previousMultiplier: currentMultiplier,
      newMultiplier: user.multiplier
    });
  } catch (error) {
    console.error('[UPGRADE-MULTIPLIER] Error:', error.message);
    console.error('[UPGRADE-MULTIPLIER] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get MinerUser by wallet ID
router.get('/miner-user/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    console.log('[GET-MINER-USER] Fetching miner user:', walletId);

    const minerUser = await MinerUser.findOne({ walletId });

    if (!minerUser) {
      return res.status(404).json({ error: 'Miner user not found' });
    }

    res.status(200).json({ minerUser });
  } catch (error) {
    console.error('[GET-MINER-USER] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all MinerUsers
router.get('/miner-users', async (req, res) => {
  try {
    console.log('[GET-ALL-MINER-USERS] Fetching all miner users...');
    const minerUsers = await MinerUser.find().sort({ createdAt: -1 });

    res.status(200).json({ 
      count: minerUsers.length,
      minerUsers 
    });
  } catch (error) {
    console.error('[GET-ALL-MINER-USERS] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get MinerUsers created within a date range
router.get('/miner-users/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    console.log('[GET-MINER-USERS-DATE-RANGE] Fetching users from', startDate, 'to', endDate);
    
    const minerUsers = await MinerUser.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ createdAt: -1 });

    res.status(200).json({ 
      count: minerUsers.length,
      minerUsers 
    });
  } catch (error) {
    console.error('[GET-MINER-USERS-DATE-RANGE] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get config by key
router.get('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('[GET-CONFIG] Fetching config:', key);

    const config = await Config.findOne({ key: key.toUpperCase() });

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    res.status(200).json({ 
      key: config.key,
      value: config.value,
      updatedAt: config.updatedAt
    });
  } catch (error) {
    console.error('[GET-CONFIG] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all configs
router.get('/config', async (req, res) => {
  try {
    console.log('[GET-ALL-CONFIGS] Fetching all configs...');
    const configs = await Config.find();

    const configMap = {};
    configs.forEach(config => {
      configMap[config.key] = config.value;
    });

    res.status(200).json({ configs: configMap });
  } catch (error) {
    console.error('[GET-ALL-CONFIGS] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard - top users by total balance (mining + ad rewards)
router.get('/leaderboard', async (req, res) => {
  try {
    console.log('[GET-LEADERBOARD] Fetching leaderboard...');
    
    // Aggregate total earned from mining across all sessions for each wallet
    const miningEarnings = await User.aggregate([
      {
        $group: {
          _id: '$wallet',
          totalEarned: { $sum: '$totalEarned' }
        }
      }
    ]);

    // Aggregate total ad rewards for each wallet
    const adRewards = await AdReward.aggregate([
      {
        $group: {
          _id: '$wallet',
          totalAdRewards: { $sum: '$rewardedTokens' }
        }
      }
    ]);

    // Create a map of wallet to ad rewards
    const adRewardsMap = {};
    adRewards.forEach(entry => {
      adRewardsMap[entry._id] = entry.totalAdRewards;
    });

    // Combine mining earnings and ad rewards
    const combinedData = miningEarnings.map(entry => ({
      wallet: entry._id,
      totalEarned: entry.totalEarned,
      totalAdRewards: adRewardsMap[entry._id] || 0,
      totalBalance: entry.totalEarned + (adRewardsMap[entry._id] || 0)
    }));

    // Add wallets that only have ad rewards (no mining)
    adRewards.forEach(entry => {
      if (!miningEarnings.find(m => m._id === entry._id)) {
        combinedData.push({
          wallet: entry._id,
          totalEarned: 0,
          totalAdRewards: entry.totalAdRewards,
          totalBalance: entry.totalAdRewards
        });
      }
    });

    // Sort by total balance (descending) and limit to top 100
    combinedData.sort((a, b) => b.totalBalance - a.totalBalance);
    const topUsers = combinedData.slice(0, 100);

    // Add rank to each entry
    const rankedLeaderboard = topUsers.map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet,
      totalEarned: entry.totalEarned,
      totalAdRewards: entry.totalAdRewards,
      totalBalance: entry.totalBalance
    }));

    console.log('[GET-LEADERBOARD] Leaderboard fetched successfully:', rankedLeaderboard.length, 'entries');

    res.status(200).json({ 
      leaderboard: rankedLeaderboard,
      count: rankedLeaderboard.length
    });
  } catch (error) {
    console.error('[GET-LEADERBOARD] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Claim ad reward - watch ad and get random tokens
router.post('/claim-ad-reward', async (req, res) => {
  try {
    const { wallet } = req.body;
    console.log('[CLAIM-AD-REWARD] Request received:', wallet);

    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Check if user exists
    const minerUser = await MinerUser.findOne({ walletId: wallet });
    if (!minerUser) {
      return res.status(404).json({ error: 'User not registered' });
    }

    // Generate random reward: 10, 20, 30, 40, 50, or 60 tokens
    const possibleRewards = [10, 20, 30, 40, 50, 60];
    const randomReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];

    // Create ad reward record
    const adReward = new AdReward({
      wallet,
      rewardedTokens: randomReward,
      claimedAt: new Date()
    });

    await adReward.save();
    console.log('[CLAIM-AD-REWARD] Reward claimed successfully:', randomReward, 'tokens');

    res.status(200).json({
      message: 'Ad reward claimed successfully',
      rewardedTokens: randomReward,
      claimedAt: adReward.claimedAt
    });
  } catch (error) {
    console.error('[CLAIM-AD-REWARD] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all ad rewards for a wallet
router.get('/ad-rewards/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    console.log('[GET-AD-REWARDS] Fetching ad rewards for:', wallet);

    const adRewards = await AdReward.find({ wallet }).sort({ claimedAt: -1 });

    const totalAdRewards = adRewards.reduce((sum, reward) => sum + reward.rewardedTokens, 0);

    res.status(200).json({
      wallet,
      adRewards,
      totalAdRewards,
      count: adRewards.length
    });
  } catch (error) {
    console.error('[GET-AD-REWARDS] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Apply referral code
router.post('/apply-referral', async (req, res) => {
  try {
    const { referredWallet, referralCode } = req.body;
    console.log('[APPLY-REFERRAL] Request:', { referredWallet, referralCode });

    if (!referredWallet || !referralCode) {
      return res.status(400).json({ error: 'Referred wallet and referral code are required' });
    }

    // Check if user is trying to refer themselves
    if (referredWallet === referralCode) {
      return res.status(400).json({ error: 'You cannot use your own referral code' });
    }

    // Check if referred user already used a referral code
    const existingReferral = await Referral.findOne({ referredWallet });
    if (existingReferral) {
      return res.status(400).json({ error: 'You have already used a referral code' });
    }

    // Check if referrer (referral code owner) exists
    const referrer = await MinerUser.findOne({ walletId: referralCode });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Check if referred user exists
    const referredUser = await MinerUser.findOne({ walletId: referredWallet });
    if (!referredUser) {
      return res.status(404).json({ error: 'User not registered' });
    }

    // Create referral record
    const referral = new Referral({
      referrerWallet: referralCode,
      referredWallet: referredWallet,
      rewardTokens: 200,
      claimedAt: new Date()
    });

    await referral.save();

    // Create ad reward for the referrer (200 tokens)
    const adReward = new AdReward({
      wallet: referralCode,
      rewardedTokens: 200,
      claimedAt: new Date()
    });

    await adReward.save();

    console.log('[APPLY-REFERRAL] Referral applied successfully');

    res.status(200).json({
      message: 'Referral code applied successfully! 200 tokens added to referrer.',
      referral,
      referrerWallet: referralCode,
      rewardedTokens: 200
    });
  } catch (error) {
    console.error('[APPLY-REFERRAL] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Check if user has used a referral code
router.get('/check-referral/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    console.log('[CHECK-REFERRAL] Checking for wallet:', wallet);

    const referral = await Referral.findOne({ referredWallet: wallet });

    res.status(200).json({
      hasUsedReferral: !!referral,
      referral: referral || null
    });
  } catch (error) {
    console.error('[CHECK-REFERRAL] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// Get referral notifications (where user is the referrer)
router.get('/referral-notifications/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    console.log('[GET-REFERRAL-NOTIFICATIONS] Fetching for wallet:', wallet);

    const referrals = await Referral.find({ referrerWallet: wallet }).sort({ claimedAt: -1 });

    res.status(200).json({
      notifications: referrals,
      count: referrals.length
    });
  } catch (error) {
    console.error('[GET-REFERRAL-NOTIFICATIONS] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get referral mining rewards (10% from referred users' mining)
router.get('/referral-mining-rewards/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    console.log('[GET-REFERRAL-MINING-REWARDS] Fetching for wallet:', wallet);

    const miningRewards = await ReferralMiningReward.find({ referrerWallet: wallet }).sort({ claimedAt: -1 });
    
    const totalMiningRewards = miningRewards.reduce((sum, reward) => sum + reward.session10percentTokens, 0);

    res.status(200).json({
      miningRewards,
      totalMiningRewards,
      count: miningRewards.length
    });
  } catch (error) {
    console.error('[GET-REFERRAL-MINING-REWARDS] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
