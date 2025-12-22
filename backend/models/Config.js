import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['MINING_RATES', 'DURATION_OPTIONS', 'COLORS']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'config'
});

export default mongoose.model('Config', configSchema);
