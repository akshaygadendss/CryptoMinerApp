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
  // Primary colors from figmadesign
  primary: '#22D3EE', // Cyan primary
  secondary: '#FB923C', // Orange secondary
  background: '#1E3A5F', // Dark blue background
  cardBg: '#2A3F5F', // Card background
  darkCard: '#1E293B', // Darker card
  text: '#FFFFFF', // White text
  textLight: '#67E8F9', // Light cyan (cyan-200)
  success: '#FB923C', // Green
  warning: '#FCD34D', // Yellow
  danger: '#E74C3C',
  bitcoin: '#F7931A',
  // Additional colors from figmadesign
  cyan: '#22D3EE',
  cyanLight: '#67E8F9',
  orange: '#FB923C',
  orangeLight: '#FDBA74',
  yellow: '#FCD34D',
  yellowLight: '#FDE68A',
  green: '#10B981',
  greenLight: '#34D399',
  slate: '#334155',
  slateDark: '#1E293B',
};
