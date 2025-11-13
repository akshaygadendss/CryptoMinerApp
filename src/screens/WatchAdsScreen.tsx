import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import api from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import LottieView from 'lottie-react-native';

interface WatchAdsScreenProps {
  navigation: any;
}

const WatchAdsScreen: React.FC<WatchAdsScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState<string>('');
  const [loading, setLoading] = useState(false); // reward claiming / ad display
  const [adLoading, setAdLoading] = useState(false); // ad request loading
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState(0);

  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Lottie area loading states
  const [lottieLoading, setLottieLoading] = useState(false);
  const [lottieFailed, setLottieFailed] = useState(false);

  useEffect(() => {
    startPulseAnimation();
    loadWallet();
    loadRewardedAd();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadWallet = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) setWallet(storedWallet);
      else navigation.replace('Signup');
    } catch (error) {}
  };

  const loadRewardedAd = () => {
    setAdLoading(true);
    setLottieFailed(false);

    const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3644060799052014/6284342949';
    const ad = RewardedAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setRewardedAd(ad);
      setAdLoading(false);
      setLottieLoading(false);
      setLottieFailed(false);
    });

    ad.addAdEventListener(AdEventType.ERROR, () => {
      setRewardedAd(null);
      setAdLoading(false);
      setLottieLoading(false);
      setLottieFailed(true);
      showErrorToast('Ad failed to load. Tap retry.');
    });

    ad.load();
  };

  const tryAdLoadFromAnimation = () => {
    setLottieLoading(true);
    setLottieFailed(false);
    loadRewardedAd();
  };

  const handleAnimationPress = () => {
    if (adLoading && !rewardedAd) {
      setLottieLoading(true);
      return;
    }

    if (!rewardedAd) {
      setLottieLoading(true);
      tryAdLoadFromAnimation();
      return;
    }

    handleWatchAd();
  };

  const handleWatchAd = async () => {
    if (!wallet) return showErrorToast('Wallet not found');

    if (!rewardedAd) return tryAdLoadFromAnimation();

    setLoading(true);

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      await claimRewardDirectly();
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setLoading(false);
      loadRewardedAd();
    });

    rewardedAd.show();
  };

  const retryAdLoad = () => {
    setLottieFailed(false);
    setLottieLoading(true);
    loadRewardedAd();
  };

  const claimRewardDirectly = async () => {
    try {
      setLoading(true);
      const result = await api.claimAdReward(wallet);

      setEarnedTokens(result.rewardedTokens);
      setShowRewardModal(true);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      showSuccessToast(`You earned ${result.rewardedTokens} tokens! 🎉`);
    } catch {
      showErrorToast('Failed to claim reward. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeRewardModal = () => {
    setShowRewardModal(false);
    navigation.navigate('Home');
  };

  // 💠 NEW → Combined loading flag (Option C)
  const isButtonLoading = loading || adLoading || lottieLoading;

  return (
    <ImageBackground
      source={require('../../assets/images/miningScreen/bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.container}>

        <Animated.Text style={[styles.title, { transform: [{ scale: pulseAnim }] }]}>
          WATCH & EARN
        </Animated.Text>

        <Text style={styles.subtitle}>Watch an ad to earn free tokens ✨</Text>

        {/* Card */}
        <Animated.View style={[styles.rewardCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.rewardTitle}>Tap the gift box to earn free tokens</Text>

          {/* Lottie area */}
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            {lottieLoading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0ff" />
                <Text style={styles.loadingText}>Ad Loading...</Text>
              </View>
            ) : lottieFailed ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.failedText}>Ad failed to load</Text>
                <TouchableOpacity style={styles.retryButton} onPress={retryAdLoad}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleAnimationPress} activeOpacity={0.7}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LottieView
                    source={require('../../assets/Animations/Gift_animation.json')}
                    autoPlay
                    loop
                    style={{ width: 180, height: 180 }}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Watch Ad Button — FULLY UPDATED */}
        <TouchableOpacity
          style={[styles.watchButton, isButtonLoading && styles.disabled]}
          onPress={handleWatchAd}
          disabled={isButtonLoading}
        >
          {isButtonLoading ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#003640" />
              <Text style={[styles.watchText, { marginLeft: 8 }]}>Loading...</Text>
            </View>
          ) : (
            <Text style={styles.watchText}>🚀 WATCH AD</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
      </View>

      {/* Reward Modal */}
      <Modal visible={showRewardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.modalTitle}>✨ Reward Unlocked ✨</Text>
            <Text style={styles.modalAmount}>{earnedTokens}</Text>
            <Text style={styles.modalAmountLabel}>TOKENS</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={closeRewardModal}>
              <Text style={styles.modalBtnText}>AWESOME!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },

  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4DF8FF',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#AEEFFF',
    opacity: 0.8,
    marginBottom: 25,
  },

  rewardCard: {
    width: '90%',
    padding: 22,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 20, 40, 0.7)',
    borderWidth: 2,
    borderColor: '#0ff',
    marginBottom: 40,
  },

  rewardTitle: {
    color: '#4DF8FF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
  },

  loadingText: {
    color: '#AEEFFF',
    marginTop: 10,
    fontSize: 14,
  },

  failedText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },

  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#0ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#88FFFF',
  },

  retryText: {
    color: '#003640',
    fontWeight: 'bold',
    fontSize: 16,
  },

  watchButton: {
    width: '80%',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#0ff',
    borderWidth: 2,
    borderColor: '#88FFFF',
  },

  disabled: { opacity: 0.6 },

  watchText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003640',
  },

  backButton: { marginTop: 18 },
  backText: { color: '#AEEFFF', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,10,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '80%',
    padding: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(0,40,60,0.9)',
    borderWidth: 2,
    borderColor: '#0ff',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 22,
    color: '#4DF8FF',
    fontWeight: 'bold',
    marginBottom: 10,
  },

  modalAmount: {
    fontSize: 70,
    color: '#00FFFF',
    fontWeight: 'bold',
  },

  modalAmountLabel: {
    fontSize: 16,
    color: '#AEEFFF',
    marginBottom: 20,
  },

  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 16,
    backgroundColor: '#00FFFF',
  },

  modalBtnText: {
    color: '#003640',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default WatchAdsScreen;
