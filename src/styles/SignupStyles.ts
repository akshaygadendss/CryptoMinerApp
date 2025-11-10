import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/mining';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImageStyle: {
    opacity: 0.1,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  walletIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FDBA74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  walletGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FDBA74',
  },
  title: {
    fontSize: 22,
    color: '#22D3EE',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A5F3FC',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2A3F5F',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: '#22D3EE',
    width: '100%',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    textAlign: 'center',
    color: '#A5F3FC',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#22D3EE',
    color: '#FFFFFF',
    borderRadius: 16,
    height: 50,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FDBA74',
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
});
