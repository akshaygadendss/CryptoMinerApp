import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api, { User } from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import notificationService from '../services/notificationService';

interface ClaimScreenProps {
  navigation: any;
}

const ClaimScreen: React.FC<ClaimScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('[ClaimScreen] Loading user data...');
      const wallet = await api.getStoredWallet();
      if (!wallet) {
        console.log('[ClaimScreen] No wallet found, redirecting to Signup');
        navigation.replace('Signup');
        return;
      }

      // Ensure mining progress is calculated before fetching
      console.log('[ClaimScreen] Calculating final progress for wallet:', wallet);
      await api.calculateProgress(wallet);

      console.log('[ClaimScreen] Fetching user data for wallet:', wallet);
      const userData = await api.getUser(wallet);
      console.log('[ClaimScreen] User data loaded:', userData);
      setUser(userData);
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to load user data:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load user data';
      showErrorToast(errorMessage, 'Error Loading Data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('[ClaimScreen] Claiming rewards for wallet:', user.wallet);
      const result = await api.claimReward(user.wallet);
      console.log('[ClaimScreen] Rewards claimed successfully');

      // Cancel any pending mining notifications since rewards are claimed
      await notificationService.cancelMiningNotifications();

      // Reward pulse animation
      Animated.sequence([
        Animated.timing(rewardAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rewardAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      showSuccessToast(`${user.currentMiningPoints.toFixed(4)} tokens claimed! 🎉`, 'Rewards Claimed');

      // Navigate back to Home
      setTimeout(() => navigation.replace('Home'), 1000);
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to claim rewards:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim rewards';
      showErrorToast(errorMessage, 'Claim Failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <LinearGradient
        colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/miningScreen/bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Text style={styles.title}>MINING COMPLETE! 🎉</Text>
        <Text style={styles.subtitle}>You've successfully mined tokens!</Text>

        {/* Reward Section */}
        <ImageBackground
          source={require('../../assets/images/miningScreen/balance.png')}
          style={styles.rewardBackground}
          resizeMode="contain"
        >
          <Animated.View style={{ transform: [{ scale: rewardAnim }] }}>
            <View style={styles.rewardHeader}>
              <Text style={styles.rewardIcon}>✨</Text>
              <Text style={styles.rewardLabel}>SESSION EARNINGS</Text>
            </View>

            <Text style={styles.rewardAmount}>
              {user.currentMiningPoints.toFixed(4)} TOKENS
            </Text>
            <Text style={styles.sessionInfo}>Earned in this mining session</Text>
          </Animated.View>
        </ImageBackground>

        {/* Claim Button */}
        <TouchableOpacity
          style={[styles.claimButton, loading && styles.buttonDisabled]}
          onPress={handleClaim}
          disabled={loading}
        >
          <Text style={styles.claimButtonIcon}>🏆</Text>
          <Text style={styles.claimButtonText}>
            {loading ? 'Claiming...' : 'CLAIM REWARDS'}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  rewardBackground: {
    width: 340,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rewardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  rewardLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  rewardAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  sessionInfo: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  claimButton: {
    backgroundColor: 'rgba(0, 163, 163, 1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 4,
    borderColor:'rgba(44, 255, 233, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  claimButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default ClaimScreen;
