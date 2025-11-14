import mongoose from 'mongoose';

const minerUserSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  collection: 'minerusers',
  //timestamps: true // This automatically adds createdAt and updatedAt fields
});

export default mongoose.model('MinerUser', minerUserSchema);
