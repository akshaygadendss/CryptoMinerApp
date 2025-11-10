import express from 'express';
import User from '../models/User.js';
import MinerUser from '../models/MinerUser.js';

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
    const user = await User.findOne({ wallet });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/start-mining', async (req, res) => {
  try {
    console.log('[START-MINING] Request received:', req.body);
    const { wallet, selectedHour, multiplier } = req.body;

    console.log('[START-MINING] Finding user:', wallet);
    const user = await User.findOne({ wallet });
    if (!user) {
      console.log('[START-MINING] User not found:', wallet);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[START-MINING] User found, updating mining status...');
    const now = new Date();
    user.status = 'mining';
    user.miningStartTime = now;
    user.currentMultiplierStartTime = now;
    user.selectedHour = selectedHour || 1;
    user.multiplier = multiplier || 1;
    user.currentMiningPoints = 0;
    user.lastUpdated = now;

    await user.save();
    console.log('[START-MINING] Mining started successfully for user:', user._id);

    res.status(200).json({ 
      message: 'Mining started successfully', 
      user 
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

    const user = await User.findOne({ wallet });
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

    const startTime = new Date(user.miningStartTime);
    const multiplierStartTime = new Date(user.currentMultiplierStartTime);
    const now = new Date();
    
    // Calculate total elapsed time from mining start
    const totalElapsedSeconds = Math.floor((now - startTime) / 1000);
    const totalSeconds = user.selectedHour * 3600;
    
    // Calculate points earned with current multiplier
    const multiplierElapsedSeconds = Math.floor((now - multiplierStartTime) / 1000);
    const tokensPerSecond = user.multiplier * 0.01;
    const newPoints = multiplierElapsedSeconds * tokensPerSecond;
    
    // Total points = previously earned + new points with current multiplier
    let currentPoints = user.currentMiningPoints + newPoints;
    let timeRemaining = Math.max(0, totalSeconds - totalElapsedSeconds);
    let progress = Math.min(100, (totalElapsedSeconds / totalSeconds) * 100);

    if (totalElapsedSeconds >= totalSeconds) {
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

    const user = await User.findOne({ wallet });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'ready_to_claim') {
      return res.status(400).json({ error: 'No rewards to claim' });
    }

    user.totalEarned += user.currentMiningPoints;
    user.currentMiningPoints = 0;
    user.status = 'claimed';
    user.lastUpdated = new Date();

    await user.save();

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

    const user = await User.findOne({ wallet });
    if (!user) {
      console.log('[UPGRADE-MULTIPLIER] User not found:', wallet);
      return res.status(404).json({ error: 'User not found' });
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
      const now = new Date();
      const multiplierStartTime = new Date(user.currentMultiplierStartTime);
      const elapsedSeconds = Math.floor((now - multiplierStartTime) / 1000);
      const tokensPerSecond = currentMultiplier * 0.01;
      const pointsEarned = elapsedSeconds * tokensPerSecond;
      
      // Add points earned with old multiplier
      user.currentMiningPoints += pointsEarned;
      
      // Reset multiplier start time for new multiplier
      user.currentMultiplierStartTime = now;
      
      console.log('[UPGRADE-MULTIPLIER] Recalculated points during mining:', {
        elapsedSeconds,
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

export default router;
