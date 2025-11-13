import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api, { MiningProgress } from '../services/api';
import { useConfig } from '../hooks/useConfig';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';
import styles from './MiningScreen.styles';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import notificationService from '../services/notificationService';

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
  const tokensAnim = useRef(new Animated.Value(1)).current;

  // Load Rewarded Ad
  const loadRewardedAd = (onRewardEarned: (reward: any) => void) => {
    const adUnitId = __DEV__
      ? TestIds.REWARDED
      : 'ca-app-pub-3644060799052014/6284342949';
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardedAd(ad));
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onRewardEarned);
    ad.addAdEventListener(AdEventType.ERROR, e => console.log('[AdMob] Error:', e));
    ad.load();
  };

  // Initialize notifications
  useEffect(() => {
    initializeNotifications();
    return () => {
      // Cleanup when component unmounts
      notificationService.cancelMiningNotifications();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      const hasPermission = await notificationService.requestPermissions();
      
      if (!hasPermission) {
        showInfoToast('Please enable notifications to get mining alerts');
      }

      // Setup notification handlers
      const unsubscribe = await notificationService.setupNotificationHandlers(navigation);
      
      // Return cleanup function
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('[Notifications] Init error:', error);
    }
  };

  useEffect(() => loadRewardedAd(() => {}), []);
  
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

    Animated.sequence([
      Animated.timing(tokensAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(tokensAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Schedule notification when mining starts or updates
    if (progress.timeRemaining > 0 && !progress.isComplete) {
      scheduleNotification(progress.timeRemaining, progress.currentPoints);
    }

    if (progress.isComplete) {
      // Don't cancel notification - let it fire naturally
      // This allows testing notifications even when app is open
      navigation.replace('Claim');
    }
  }, [progress]);

  const scheduleNotification = async (timeRemaining: number, currentPoints: number) => {
    try {
      // Only schedule if we haven't scheduled yet (check if notification already exists)
      const scheduledNotifs = await notificationService.getScheduledNotifications();
      const existingNotif = scheduledNotifs.find(n => n.notification.id === 'mining-complete');
      
      // Only schedule if no notification exists yet
      if (!existingNotif) {
        // Calculate final tokens (approximate)
        const rate = miningRates?.[currentMultiplier]?.rate || 0;
        const finalTokens = currentPoints + (timeRemaining * rate);
        
        await notificationService.scheduleMiningCompleteNotification(
          timeRemaining,
          finalTokens
        );
        console.log('[Notifications] ✅ Scheduled for', timeRemaining, 'seconds');
      } else {
        console.log('[Notifications] Already scheduled, skipping');
      }
    } catch (error) {
      console.error('[Notifications] Schedule error:', error);
    }
  };

  const loadWalletAndProgress = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) {
        setWallet(storedWallet);
        const user = await api.getUser(storedWallet);
        setCurrentMultiplier(user.multiplier || 1);
        updateProgress();
      }
    } catch (e) {
      console.error('[MiningScreen] Wallet load failed:', e);
    }
  };

  const updateProgress = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (!storedWallet) return;
      const data = await api.calculateProgress(storedWallet);
      setProgress(data);
    } catch (e) {
      console.error('[MiningScreen] Progress update failed:', e);
    }
  };

  const handleUpgradeMultiplier = () => setShowMultiplierModal(true);

  const watchAdAndUpgrade = async () => {
    setShowMultiplierModal(false);
    if (!rewardedAd) {
      showInfoToast('Loading ad, please try again shortly.');
      loadRewardedAd(() => {});
      return;
    }
    try {
      const nextMultiplier = currentMultiplier + 1;
      if (!wallet) return showErrorToast('Wallet not found');
      if (nextMultiplier > 6)
        return showInfoToast('You have reached the max multiplier (6×)');

      setLoadingAd(true);
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
        await api.upgradeMultiplier(wallet, nextMultiplier);
        setCurrentMultiplier(nextMultiplier);
        if (miningRates)
          showSuccessToast(
            `Now earning ${miningRates[nextMultiplier].hourlyReward.toFixed(2)} tokens/hr!`,
            `Upgraded to ${nextMultiplier}×`
          );
        await loadWalletAndProgress();
        
        // Reschedule notification with new rate
        if (progress.timeRemaining > 0) {
          scheduleNotification(progress.timeRemaining, progress.currentPoints);
        }
      });

      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        setLoadingAd(false);
        loadRewardedAd(() => {});
      });

      rewardedAd.show();
    } catch (e) {
      showErrorToast('Failed to show ad. Try again later.');
      setLoadingAd(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  if (configLoading || !miningRates)
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

  const canUpgrade = currentMultiplier < 6;

  return (
    <ImageBackground
      source={require('../../assets/images/miningScreen/bg.png')}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40,
        }}
      >
        {/* Mining Info Section */}
        <ImageBackground
          source={require('../../assets/images/miningScreen/signup_card.png')}
          style={{
            width: 340,
            height: 400,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 25,
            marginBottom: 30,
          }}
          resizeMode="contain"
        >
          <Text
            style={{
              color: '#00FFFF',
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            MINING IN PROGRESS
          </Text>

          <Text style={{ color: '#ccc', textAlign: 'center', fontSize: 14 }}>
            ⏱️ TIME REMAINING
          </Text>
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 'bold',
              marginTop: 5,
            }}
          >
            {formatTime(progress.timeRemaining)}
          </Text>

          {/* Progress Bar */}
          <View style={{ marginVertical: 20, width: '80%' }}>
            <View
              style={{
                height: 10,
                backgroundColor: '#222',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#00FFFF',
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>
            <Text
              style={{
                color: '#ccc',
                textAlign: 'center',
                marginTop: 6,
                fontSize: 13,
              }}
            >
              {progress.progress.toFixed(1)}% COMPLETE
            </Text>
          </View>

          {/* Tokens */}
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#FFD700', fontSize: 16 }}>🪙 TOKENS MINED</Text>
            <Animated.Text
              style={{
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
                transform: [{ scale: tokensAnim }],
                marginTop: 5,
              }}
            >
              {progress.currentPoints.toFixed(4)} TOKENS
            </Animated.Text>
          </View>
        </ImageBackground>

        {/* Balance Section */}
        <ImageBackground
          source={require('../../assets/images/miningScreen/balance.png')}
          style={{
            width: 340,
            height: 140,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 30,
          }}
          resizeMode="contain"
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity onPress={handleUpgradeMultiplier}>
              <Text style={{ color: '#00FFFF', fontSize: 14, fontWeight: 'bold' }}>
                MULTIPLIER
              </Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                {currentMultiplier}×
              </Text>
              {canUpgrade && (
                <Text style={{ color: '#999', fontSize: 11 }}>Tap to upgrade</Text>
              )}
            </TouchableOpacity>

            <View>
              <Text style={{ color: '#00FFFF', fontSize: 14, fontWeight: 'bold' }}>
                RATE
              </Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                {miningRates[currentMultiplier].rate.toFixed(4)}/sec
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Back Button */}
        <TouchableOpacity
          style={{
            marginTop: 30,
            backgroundColor: '#00FFFF',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 50,
            elevation: 6,
          }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text
            style={{
              color: '#001F2D',
              fontWeight: 'bold',
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            🏠 BACK TO HOME
          </Text>
        </TouchableOpacity>


      </ScrollView>

      {/* Modals (Unchanged) */}
      <Modal visible={showMultiplierModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upgrade Multiplier</Text>
            <Text style={styles.modalSubtitle}>Watch an ad to increase your rate</Text>
            <View style={styles.currentMultiplierInfo}>
              <Text style={styles.infoLabel}>Current: {currentMultiplier}×</Text>
              <Text style={styles.infoValue}>
                {miningRates[currentMultiplier].hourlyReward.toFixed(2)} tokens/hr
              </Text>
            </View>
            {currentMultiplier < 6 ? (
              <TouchableOpacity style={styles.multiplierOption} onPress={watchAdAndUpgrade}>
                <Text style={styles.multiplierOptionTitle}>
                  {currentMultiplier + 1}× Multiplier
                </Text>
                <Text style={styles.multiplierOptionRate}>
                  {miningRates[currentMultiplier + 1].hourlyReward.toFixed(2)} tokens/hr
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.maxMultiplierMessage}>
                <Text style={styles.maxMultiplierText}>🎉 Max Multiplier Reached</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMultiplierModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={loadingAd} transparent>
        <View style={styles.adLoadingOverlay}>
          <View style={styles.adLoadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.adLoadingText}>Loading Advertisement...</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default MiningScreen;