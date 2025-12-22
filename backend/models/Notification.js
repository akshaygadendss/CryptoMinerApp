import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['referral', 'mining', 'reward'],
    default: 'referral',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    referrerWallet: String,
    referredWallet: String,
    tokens: Number,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
