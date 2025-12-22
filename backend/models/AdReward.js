import mongoose from 'mongoose';

const adRewardSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    trim: true,
  },
  rewardedTokens: {
    type: Number,
    required: true,
    default: 0,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
});

const AdReward = mongoose.model('AdReward', adRewardSchema);

export default AdReward;
