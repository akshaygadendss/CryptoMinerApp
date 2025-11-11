import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Config from './models/Config.js';

dotenv.config();

const MINING_RATES = {
  1: { rate: 0.0100, hourlyReward: 36.00 },
  2: { rate: 0.0200, hourlyReward: 72.00 },
  3: { rate: 0.0300, hourlyReward: 108.00 },
  4: { rate: 0.0400, hourlyReward: 144.00 },
  5: { rate: 0.0500, hourlyReward: 180.00 },
  6: { rate: 0.0600, hourlyReward: 216.00 },
};

const DURATION_OPTIONS = [
  { value: 1, label: '1 Hour' },
  { value: 2, label: '2 Hours' },
  { value: 4, label: '4 Hours' },
  { value: 12, label: '12 Hours' },
  { value: 24, label: '24 Hours' },
];

const COLORS = {
  primary: '#6366F1',
  secondary: '#1E293B',
  background: '#0F172A',
  cardBg: '#1E293B',
  darkCard: '#334155',
  text: '#F1F5F9',
  textLight: '#CBD5E1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  bitcoin: '#F59E0B',
  navyDark: '#0F172A',
  steel: '#475569',
  tealSoft: '#10B981',
  mint: '#34D399',
  navyLight: '#1E293B',
  steelLight: '#64748B',
  tealLight: '#34D399',
  mintDark: '#059669',
  slate: '#475569',
  slateDark: '#334155',
  cyan: '#6366F1',
  cyanLight: '#818CF8',
  orange: '#F59E0B',
  orangeLight: '#FBBF24',
  green: '#10B981',
  greenLight: '#34D399',
  yellow: '#F59E0B',
  yellowLight: '#FBBF24',
  gradientStart: '#6366F1',
  gradientMiddle: '#8B5CF6',
  gradientEnd: '#EC4899',
  gradientAccent: '#F59E0B',
};

async function seedConfig() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Seed MINING_RATES
    await Config.findOneAndUpdate(
      { key: 'MINING_RATES' },
      { key: 'MINING_RATES', value: MINING_RATES, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('✅ MINING_RATES seeded');

    // Seed DURATION_OPTIONS
    await Config.findOneAndUpdate(
      { key: 'DURATION_OPTIONS' },
      { key: 'DURATION_OPTIONS', value: DURATION_OPTIONS, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('✅ DURATION_OPTIONS seeded');

    // Seed COLORS
    await Config.findOneAndUpdate(
      { key: 'COLORS' },
      { key: 'COLORS', value: COLORS, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('✅ COLORS seeded');

    console.log('🎉 All config data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding config:', error);
    process.exit(1);
  }
}

seedConfig();
