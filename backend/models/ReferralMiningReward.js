import mongoose from 'mongoose';

const referralMiningRewardSchema = new mongoose.Schema({
  referrerWallet: {
    type: String,
    required: true,
    trim: true,
  },
  referredWallet: {
    type: String,
    required: true,
    trim: true,
  },
  session10percentTokens: {
    type: Number,
    required: true,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
});

const ReferralMiningReward = mongoose.model('ReferralMiningReward', referralMiningRewardSchema);

export default ReferralMiningReward;
