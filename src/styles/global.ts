import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/mining';

export const globalStyles = StyleSheet.create({
  // Common Container Styles
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Common Button Styles
  primaryButton: {
    backgroundColor: COLORS.buttonBackgroundColor,
    borderColor: COLORS.buttonBorderColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 50,
    elevation: 6,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  // Common Spacing
  marginTop15: {
    marginTop: 15,
  },
  marginTop20: {
    marginTop: 20,
  },

  // Common Banner Ad Container
  bannerAdContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bannerAdContainerBottom: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
});
