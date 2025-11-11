import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api, { MiningProgress } from '../services/api';
import { useConfig } from '../hooks/useConfig';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';
import styles from './MiningScreen.styles';

// ✅ Import AdMob
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

interface MiningScreenProps {
  navigation: any;
}

const MiningScreen: React.FC<MiningScreenProps> = ({ navigation }) => {
  const { miningRates, loading: configLoading } = useConfig();
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
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pickaxeAnim = useRef(new Animated.Value(0)).current;
  const tokensAnim = useRef(new Animated.Value(1)).current;

  // 🪙 Helper: Load Rewarded Ad
  const loadRewardedAd = (onRewardEarned: (reward: any) => void) => {
    const adUnitId = __DEV__
      ? TestIds.REWARDED
      : 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'; // Replace with your AdMob Rewarded Ad ID

    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[AdMob] Rewarded ad loaded');
      setRewardedAd(ad);
    });

    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
      console.log('[AdMob] Reward granted:', reward);
      onRewardEarned(reward);
    });

    ad.addAdEventListener(AdEventType.ERROR, error => {
      console.log('[AdMob] Failed to load ad:', error);
    });

    ad.load();
  };

  // 🧠 Load Rewarded Ad on Mount
  useEffect(() => {
    loadRewardedAd(reward => {
      console.log('Reward granted:', reward);
    });
  }, []);

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
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) {
        setWallet(storedWallet);
        const userData = await api.getUser(storedWallet);
        setCurrentMultiplier(userData.multiplier || 1);
        updateProgress();
      }
    } catch (error: any) {
      console.error('[MiningScreen] Failed to load wallet:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (!storedWallet) return;

      const progressData = await api.calculateProgress(storedWallet);
      setProgress(progressData);
    } catch (error: any) {
      console.error('[MiningScreen] Failed to update progress:', error);
    }
  };

  const handleUpgradeMultiplier = () => {
    setShowMultiplierModal(true);
  };

  // ✅ Watch Ad + Upgrade
  const watchAdAndUpgrade = async () => {
    setShowMultiplierModal(false);

    if (!rewardedAd) {
      showInfoToast('Loading ad, please try again in a few seconds.');
      loadRewardedAd(() => {});
      return;
    }

    try {
      if (!wallet) {
        showErrorToast('Wallet not found');
        return;
      }

      const nextMultiplier = currentMultiplier + 1;
      if (nextMultiplier > 6) {
        showInfoToast('You have reached the maximum multiplier of 6×', 'Maximum Reached');
        return;
      }

      setLoadingAd(true);

      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async reward => {
        console.log('[MiningScreen] Reward earned:', reward);

        await api.upgradeMultiplier(wallet, nextMultiplier);
        setCurrentMultiplier(nextMultiplier);

        if (miningRates) {
          showSuccessToast(
            `You now earn ${miningRates[nextMultiplier].hourlyReward.toFixed(2)} tokens/hour! 🚀`,
            `Upgraded to ${nextMultiplier}× Multiplier`
          );
        }

        await loadWalletAndProgress();
      });

      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        setLoadingAd(false);
        loadRewardedAd(() => {}); // Preload next ad
      });

      rewardedAd.show();
    } catch (error: any) {
      console.error('[MiningScreen] Failed to show ad:', error);
      showErrorToast('Failed to show ad. Try again later.');
      setLoadingAd(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
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

  if (configLoading || !miningRates) {
    return (
      <LinearGradient
        colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }



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
                {miningRates[currentMultiplier].rate.toFixed(4)}/sec
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
                {miningRates[currentMultiplier].hourlyReward.toFixed(2)} tokens/hour
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
                    {miningRates[currentMultiplier + 1].hourlyReward.toFixed(2)} tokens/hour
                  </Text>
                  <Text style={styles.multiplierBoost}>
                    +{((miningRates[currentMultiplier + 1].hourlyReward - miningRates[currentMultiplier].hourlyReward) / miningRates[currentMultiplier].hourlyReward * 100).toFixed(0)}% increase
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

export default MiningScreen;