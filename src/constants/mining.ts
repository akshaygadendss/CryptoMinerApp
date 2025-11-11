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
  // 🎨 Primary Theme Colors (Dark Modern Gradient Palette)
  primary: '#6366F1',     // Indigo — primary brand color
  secondary: '#1E293B',   // Dark slate — secondary tone
  background: '#0F172A',  // Deep navy background
  cardBg: '#1E293B',      // Dark slate card background
  darkCard: '#334155',    // Slate for contrast cards
  text: '#F1F5F9',        // Light text — readable on dark
  textLight: '#CBD5E1',   // Muted light text

  // ✅ Status Colors
  success: '#10B981',     // Emerald green — success
  warning: '#F59E0B',     // Amber — warning
  danger: '#EF4444',      // Red — danger/error
  bitcoin: '#F59E0B',     // Amber for crypto highlights

  // 🌈 Extended Palette
  navyDark: '#0F172A',    // Deep navy (Background)
  steel: '#475569',       // Steel slate
  tealSoft: '#10B981',    // Emerald (Success accent)
  mint: '#34D399',        // Light emerald

  // 🩵 Complementary Shades
  navyLight: '#1E293B',   // Lighter navy
  steelLight: '#64748B',  // Light steel
  tealLight: '#34D399',   // Light emerald for gradients
  mintDark: '#059669',    // Dark emerald

  // 🩶 Neutral Shades
  slate: '#475569',       // Slate tone
  slateDark: '#334155',   // Darker slate

  // 🎨 UI Colors with Gradient Support
  cyan: '#6366F1',        // Indigo (Primary)
  cyanLight: '#818CF8',   // Light indigo
  orange: '#F59E0B',      // Amber
  orangeLight: '#FBBF24', // Light amber
  green: '#10B981',       // Emerald
  greenLight: '#34D399',  // Light emerald
  yellow: '#F59E0B',      // Amber for ready state
  yellowLight: '#FBBF24', // Light amber

  // 🎨 Gradient Colors
  gradientStart: '#6366F1',  // Indigo
  gradientMiddle: '#8B5CF6', // Purple
  gradientEnd: '#EC4899',    // Pink
  gradientAccent: '#F59E0B', // Amber accent
};
