export const MINING_RATES: Record<number, { rate: number; hourlyReward: number }> = {
  1: { rate: 0.0100, hourlyReward: 36.00 },
  2: { rate: 0.0200, hourlyReward: 72.00 },
  3: { rate: 0.0300, hourlyReward: 108.00 },
  4: { rate: 0.0400, hourlyReward: 144.00 },
  5: { rate: 0.0500, hourlyReward: 180.00 },
  6: { rate: 0.0600, hourlyReward: 216.00 },
};

export const DURATION_OPTIONS = [
  { value: 1, label: '1 Hour' },
  { value: 2, label: '2 Hours' },
  { value: 4, label: '4 Hours' },
  { value: 12, label: '12 Hours' },
  { value: 24, label: '24 Hours' },
];

export const COLORS = {
  primary: '#0b0b0bff',
  secondary: '#F5A623',
  background: '#E8F4F8',
  cardBg: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  bitcoin: '#F7931A',
};
