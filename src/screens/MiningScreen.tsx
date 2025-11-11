import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, MINING_RATES } from '../constants/mining';
import api, { MiningProgress } from '../services/api';

interface MiningScreenProps {
  navigation: any;
}

const MiningScreen: React.FC<MiningScreenProps> = ({ navigation }) => {
  const [progress, setProgress] = useState<MiningProgress>({
    currentPoints: 0,
    timeElapsed: 0,
    timeRemaining: 0,
    progress: 0,
    isComplete: false,
  });
  const [wallet, setWallet] = useState<string>('');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [showMultiplierModal, setShowMultiplierModal] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pickaxeAnim = useRef(new Animated.Value(0)).current;
  const tokensAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadWalletAndProgress();
    const interval = setInterval(updateProgress, 1000);
    
    // Animate pickaxe
    Animated.loop(
      Animated.sequence([
        Animated.timing(pickaxeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Animate tokens
    Animated.sequence([
      Animated.timing(tokensAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tokensAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (progress.isComplete) {
      navigation.replace('Claim');
    }
  }, [progress]);

  const loadWalletAndProgress = async () => {
    try {
      console.log('[MiningScreen] Loading wallet and progress...');
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) {
        console.log('[MiningScreen] Wallet found:', storedWallet);
        setWallet(storedWallet);
        
        // Get user data to fetch current multiplier
        const userData = await api.getUser(storedWallet);
        setCurrentMultiplier(userData.multiplier || 1);
        
        updateProgress();
      } else {
        console.log('[MiningScreen] No wallet found');
      }
    } catch (error: any) {
      console.error('[MiningScreen] Failed to load wallet:', {
        message: error.message,
        response: error.response?.data
      });
    }
  };

  const updateProgress = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (!storedWallet) {
        console.log('[MiningScreen] No wallet found for progress update');
        return;
      }

      const progressData = await api.calculateProgress(storedWallet);
      console.log('[MiningScreen] Progress updated:', progressData);
      setProgress(progressData);
    } catch (error: any) {
      console.error('[MiningScreen] Failed to update progress:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const handleUpgradeMultiplier = () => {
    setShowMultiplierModal(true);
  };

  const watchAdAndUpgrade = async () => {
    setShowMultiplierModal(false);
    setLoadingAd(true);

    try {
      if (!wallet) {
        Alert.alert('Error', 'Wallet not found');
        return;
      }

      // Calculate next multiplier (sequential progression)
      const nextMultiplier = currentMultiplier + 1;

      // Validate max multiplier
      if (nextMultiplier > 6) {
        Alert.alert('Maximum Reached', 'You have reached the maximum multiplier of 6×');
        return;
      }

      // Simulate ad loading/watching
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000)); // Simulate ad duration

      // After ad is watched, upgrade multiplier
      console.log('[MiningScreen] Upgrading multiplier:', { 
        current: currentMultiplier, 
        next: nextMultiplier 
      });
      
      await api.upgradeMultiplier(wallet, nextMultiplier);
      
      setCurrentMultiplier(nextMultiplier);
      
      // Show success message
      Alert.alert(
        'Success!', 
        `Multiplier upgraded to ${nextMultiplier}×\nYou now earn ${MINING_RATES[nextMultiplier].hourlyReward.toFixed(2)} tokens/hour`
      );
      
      // Reload progress to reflect new multiplier
      await loadWalletAndProgress();
      
    } catch (error: any) {
      console.error('[MiningScreen] Failed to upgrade multiplier:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upgrade multiplier. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingAd(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canUpgrade = currentMultiplier < 6;

  const pickaxeRotation = pickaxeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const pickaxeTranslateY = pickaxeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0],
  });

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>MINING IN PROGRESS</Text>

        {/* Mining Animation */}
        <View style={styles.miningAnimationContainer}>
          <Animated.View
            style={[
              styles.pickaxeContainer,
              {
                transform: [
                  { rotate: pickaxeRotation },
                  { translateY: pickaxeTranslateY },
                ],
              },
            ]}
          >
            <View style={styles.pickaxeIcon}>
              <Text style={styles.pickaxeText}>⛏️</Text>
            </View>
          </Animated.View>
        </View>

        {/* Mining Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoLabel}>TIME REMAINING</Text>
          </View>
          <Text style={styles.timeText}>
            {formatTime(progress.timeRemaining)}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.progress.toFixed(1)}% COMPLETE
            </Text>
          </View>

          {/* Mined Tokens */}
          <View style={styles.tokensCard}>
            <View style={styles.tokensHeader}>
              <Text style={styles.tokensIcon}>🪙</Text>
              <Text style={styles.tokensLabel}>TOKENS MINED</Text>
            </View>
            <Animated.Text
              style={[
                styles.tokensAmount,
                {
                  transform: [{ scale: tokensAnim }],
                },
              ]}
            >
              {progress.currentPoints.toFixed(4)} TOKENS
            </Animated.Text>
          </View>
        </View>

        {/* Mining Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.8}
              onPress={handleUpgradeMultiplier}
            >
              <Text style={styles.statLabel}>MULTIPLIER</Text>
              <Text style={styles.statValue}>{currentMultiplier}×</Text>
              {canUpgrade && (
                <Text style={styles.statHint}>Tap to upgrade</Text>
              )}
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>RATE</Text>
              <Text style={styles.statValue}>
                {MINING_RATES[currentMultiplier].rate.toFixed(4)}/sec
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonIcon}>🏠</Text>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Multiplier Upgrade Modal */}
      <Modal
        visible={showMultiplierModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upgrade Multiplier</Text>
            <Text style={styles.modalSubtitle}>
              Watch an ad to increase your mining rate
            </Text>

            <View style={styles.currentMultiplierInfo}>
              <Text style={styles.infoLabel}>Current: {currentMultiplier}×</Text>
              <Text style={styles.infoValue}>
                {MINING_RATES[currentMultiplier].hourlyReward.toFixed(2)} tokens/hour
              </Text>
            </View>

            <View style={styles.multiplierOptions}>
              {currentMultiplier < 6 && (
                <TouchableOpacity
                  style={styles.multiplierOption}
                  onPress={watchAdAndUpgrade}
                >
                  <View style={styles.multiplierOptionHeader}>
                    <Text style={styles.multiplierOptionTitle}>
                      {currentMultiplier + 1}× Multiplier
                    </Text>
                    <View style={styles.adBadge}>
                      <Text style={styles.adBadgeText}>Watch Ad</Text>
                    </View>
                  </View>
                  <Text style={styles.multiplierOptionRate}>
                    {MINING_RATES[currentMultiplier + 1].hourlyReward.toFixed(2)} tokens/hour
                  </Text>
                  <Text style={styles.multiplierBoost}>
                    +{((MINING_RATES[currentMultiplier + 1].hourlyReward - MINING_RATES[currentMultiplier].hourlyReward) / MINING_RATES[currentMultiplier].hourlyReward * 100).toFixed(0)}% increase
                  </Text>
                  <Text style={styles.upgradeNote}>
                    Sequential upgrade: {currentMultiplier}× → {currentMultiplier + 1}×
                  </Text>
                </TouchableOpacity>
              )}
              {currentMultiplier >= 6 && (
                <View style={styles.maxMultiplierMessage}>
                  <Text style={styles.maxMultiplierText}>
                    🎉 Maximum Multiplier Reached!
                  </Text>
                  <Text style={styles.maxMultiplierSubtext}>
                    You're earning at the highest rate possible
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMultiplierModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ad Loading Modal */}
      <Modal visible={loadingAd} transparent={true}>
        <View style={styles.adLoadingOverlay}>
          <View style={styles.adLoadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.adLoadingText}>Loading Advertisement...</Text>
            <Text style={styles.adLoadingSubtext}>Please wait</Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 32,
  },
  miningAnimationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pickaxeContainer: {
    position: 'relative',
  },
  pickaxeIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.orange,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pickaxeText: {
    fontSize: 64,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    borderWidth: 4,
    borderColor: COLORS.cyan,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 24,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.slate,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  tokensCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.orange,
  },
  tokensHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tokensIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tokensLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  tokensAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 4,
    borderColor: COLORS.orange,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statHint: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textLight,
  },
  cancelButton: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderColor: COLORS.slate,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonIcon: {
    fontSize: 20,
    color: COLORS.textLight,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 4,
    borderColor: COLORS.orange,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  currentMultiplierInfo: {
    backgroundColor: COLORS.darkCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.bitcoin,
  },
  multiplierOptions: {
    marginBottom: 20,
  },
  multiplierOption: {
    backgroundColor: COLORS.darkCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  multiplierOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  multiplierOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  multiplierOptionRate: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  multiplierBoost: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  upgradeNote: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  maxMultiplierMessage: {
    backgroundColor: COLORS.success,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  maxMultiplierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  maxMultiplierSubtext: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.9,
  },
  adBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  adBadgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: COLORS.darkCard,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  adLoadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adLoadingContent: {
    backgroundColor: COLORS.cardBg,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  adLoadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 15,
    fontWeight: 'bold',
  },
  adLoadingSubtext: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 5,
  },
  homeButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderColor: COLORS.cyanLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  homeButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkCard,
  },
});

export default MiningScreen;
