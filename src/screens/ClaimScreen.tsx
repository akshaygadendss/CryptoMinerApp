import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api, { User } from '../services/api';

interface ClaimScreenProps {
  navigation: any;
}

const ClaimScreen: React.FC<ClaimScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trophyAnim] = useState(new Animated.Value(1));
  const [rewardAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadUserData();
    
    // Animate trophy
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(trophyAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();

    // Animate confetti
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
      
      // Calculate progress first to ensure currentMiningPoints is updated
      console.log('[ClaimScreen] Calculating final progress for wallet:', wallet);
      await api.calculateProgress(wallet);
      
      console.log('[ClaimScreen] Fetching user data for wallet:', wallet);
      const userData = await api.getUser(wallet);
      console.log('[ClaimScreen] User data loaded:', userData);
      setUser(userData);
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to load user data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load user data';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('[ClaimScreen] Claiming rewards for wallet:', user.wallet);
      await api.claimReward(user.wallet);
      console.log('[ClaimScreen] Rewards claimed successfully');
      
      // Animate reward
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
      
      // Redirect to Home to show Start Mining option
      navigation.replace('Home');
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to claim rewards:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim rewards';
      Alert.alert('Error', errorMessage);
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const trophyRotation = trophyAnim.interpolate({
    inputRange: [1, 1.1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Trophy Icon */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [
                { scale: trophyAnim },
                { rotate: trophyRotation },
              ],
            },
          ]}
        >
          <View style={styles.trophyIcon}>
            <Text style={styles.trophyText}>🏆</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>MINING COMPLETE! 🎉</Text>
        <Text style={styles.subtitle}>
          You've successfully mined tokens!
        </Text>

        {/* Reward Display */}
        <Animated.View
          style={[
            styles.rewardCard,
            {
              transform: [{ scale: rewardAnim }],
            },
          ]}
        >
          <View style={styles.rewardHeader}>
            <Text style={styles.rewardIcon}>✨</Text>
            <Text style={styles.rewardLabel}>SESSION EARNINGS</Text>
          </View>
          <Text style={styles.rewardAmount}>
            {user.currentMiningPoints.toFixed(4)} TOKENS
          </Text>
          <Text style={styles.sessionInfo}>
            Earned in this mining session
          </Text>
        </Animated.View>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  trophyContainer: {
    marginBottom: 24,
  },
  trophyIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.yellow,
    borderWidth: 4,
    borderColor: COLORS.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  trophyText: {
    fontSize: 56,
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
  rewardCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.orange,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
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
    fontSize: 24,
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
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
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
