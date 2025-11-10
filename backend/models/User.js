import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  multiplier: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  status: {
    type: String,
    enum: ['idle', 'mining', 'ready_to_claim', 'claimed'],
    default: 'idle'
  },
  miningStartTime: {
    type: Date,
    default: null
  },
  currentMultiplierStartTime: {
    type: Date,
    default: null
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  currentMiningPoints: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  selectedHour: {
    type: Number,
    default: 1
  }
}, {
  collection: 'minerdata'
});

export default mongoose.model('User', userSchema);
