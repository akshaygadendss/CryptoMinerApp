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

  useEffect(() => {
    loadWalletAndProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

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
      // In production, integrate with Google AdMob:
      // import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
      
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mining in Progress</Text>

        <View style={styles.miningCard}>
          <Text style={styles.tokensLabel}>Tokens Mined</Text>
          <Text style={styles.tokensAmount}>
            {progress.currentPoints.toFixed(4)}
          </Text>

          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>{currentMultiplier}× Multiplier</Text>
          </View>

          <View style={styles.progressBarContainer}>
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
            {progress.progress.toFixed(1)}% Complete
          </Text>
        </View>

        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time Elapsed</Text>
            <Text style={styles.timeValue}>{formatTime(progress.timeElapsed)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time Remaining</Text>
            <Text style={styles.timeValue}>{formatTime(progress.timeRemaining)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Mining Rate</Text>
            <Text style={styles.rateValue}>
              {MINING_RATES[currentMultiplier].hourlyReward.toFixed(2)} tokens/hr
            </Text>
          </View>
        </View>

        {canUpgrade && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgradeMultiplier}
          >
            <Text style={styles.upgradeButtonText}>
              🚀 Upgrade Multiplier (Watch Ad)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  miningCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tokensLabel: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  tokensAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.bitcoin,
    marginBottom: 15,
  },
  multiplierBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  multiplierText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  timeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textLight,
    marginVertical: 10,
    opacity: 0.3,
  },
  upgradeButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: COLORS.textLight,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
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
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 5,
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
    backgroundColor: COLORS.background,
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
    color: '#FFFFFF',
    marginBottom: 5,
  },
  maxMultiplierSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  adBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: COLORS.background,
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
});

export default MiningScreen;