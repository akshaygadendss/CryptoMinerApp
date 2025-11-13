import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  ImageBackground,
  Image,
  StyleSheet,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { COLORS } from '../constants/mining';
import api, { User, UserSummary } from '../services/api';
import { useConfig } from '../hooks/useConfig';
import { styles as baseStyles } from './HomeScreen.styles';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { miningRates, durationOptions, loading: configLoading } = useConfig();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(1);

  const [balanceAnim] = useState(new Animated.Value(1));
  const [mineNowAnim] = useState(new Animated.Value(1));

  /* NEW — Ads button animation */
  const [adsPulseAnim] = useState(new Animated.Value(1));

  const walletAnimRef = useRef<LottieView>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      return undefined;
    }, [])
  );

  /* Pulsating for balance text */
  useEffect(() => {
    if (user) {
      Animated.sequence([
        Animated.timing(balanceAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(balanceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user?.totalEarned]);

  /* Mining button pulse */
  useEffect(() => {
    mineNowAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(mineNowAnim, {
          toValue: user?.status === 'mining' ? 1.15 : 1.05,
          duration: user?.status === 'mining' ? 800 : 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mineNowAnim, {
          toValue: 1,
          duration: user?.status === 'mining' ? 800 : 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [user?.status]);

  /* NEW — Ads button pulse animation */
  useEffect(() => {
    adsPulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(adsPulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(adsPulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadUserData = async () => {
    try {
      const wallet = await api.getStoredWallet();
      if (!wallet) {
        navigation.replace('Signup');
        return;
      }
      const userData = await api.getUser(wallet);
      setUser(userData);

      try {
        const summary: UserSummary = await api.getUserSummary(wallet);
        setTotalBalance(summary.totalBalance || 0);
      } catch {
        setTotalBalance(userData?.totalEarned || 0);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load user data';
      showErrorToast(errorMessage, 'Error Loading Data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMining = () => {
    if (user?.status === 'mining') {
      navigation.navigate('Mining');
    } else {
      setShowDurationModal(true);
    }
  };

  const handleDurationConfirm = async () => {
    if (!user) return;
    setShowDurationModal(false);
    setLoading(true);
    try {
      await api.startMining(user.wallet, selectedHour, 1);
      showSuccessToast(`Mining started for ${selectedHour} hour(s)! ⛏️`, 'Mining Started');
      navigation.navigate('Mining');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start mining';
      showErrorToast(errorMessage, 'Mining Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('wallet');
      showInfoToast('You have been logged out', 'Logged Out! 👋');
    } catch {}
    navigation.replace('Signup');
  };

  if (loading || configLoading || !miningRates || !durationOptions) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]} style={baseStyles.container}>
        <View style={baseStyles.loadingContainer}>
          <Text style={baseStyles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/homescreen/bg.png')}
      style={baseStyles.container}
      resizeMode="cover"
    >
      {/* Avatar Card */}
      <View style={localStyles.avatarCard}>
        <View style={localStyles.avatarLeft}>
          <Image source={require('../../assets/images/homescreen/avatar.png')} style={localStyles.avatarImage} />
        </View>
        <View style={localStyles.avatarTextContainer}>
          <Text style={localStyles.avatarTitle} numberOfLines={1}>
            {user?.wallet ? (user.wallet.length > 6 ? `${user.wallet.slice(0, 6)}....` : user.wallet) : 'MINER'}
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={localStyles.logoutButton} onPress={handleLogout}>
        <Text style={localStyles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* Dashboard Title */}
      <Text style={localStyles.dashboardTitle}>Dashboard</Text>

      {/* Balance Section */}
      <View style={localStyles.balanceContainer}>
        <Image source={require('../../assets/images/homescreen/balance.png')} style={localStyles.balanceImage} />
        <View style={localStyles.balanceTextContainer}>
          <Text style={localStyles.totalBalanceLabel}>Total Balance</Text>
          <Animated.Text style={[localStyles.balanceText, { transform: [{ scale: balanceAnim }] }]}>
            {totalBalance.toFixed(4)} TOKENS
          </Animated.Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={localStyles.actionButtonsContainer}>
        {/* Leaderboard */}
        <TouchableOpacity
          style={localStyles.leaderboardButton}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.8}
        >
          <Text style={localStyles.leaderboardButtonText}>🏆 Leaderboard</Text>
        </TouchableOpacity>

        {/* WATCH ADS — NOW WITH SAME PULSE AS MINE NOW */}
        <Animated.View style={{ transform: [{ scale: adsPulseAnim }] }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WatchAds')}
            activeOpacity={0.75}
            style={localStyles.watchAdsButtonContainer}
          >
            <Image
              source={require('../../assets/images/homescreen/ad_button.png')}
              style={localStyles.watchAdsButtonImage}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Mining or Claim Reward */}
      {user?.status === 'ready_to_claim' ? (
        <TouchableOpacity onPress={() => navigation.navigate('Claim')} activeOpacity={0.8} style={localStyles.claimRewardButton}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={localStyles.claimGradient}>
            <Text style={localStyles.claimRewardText}>🎁 CLAIM REWARD</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleStartMining} activeOpacity={0.8} style={localStyles.mineNowContainer}>
          <Animated.Image
            source={
              user?.status === 'mining'
                ? require('../../assets/images/homescreen/mining.png')
                : require('../../assets/images/homescreen/mine_now.png')
            }
            style={[localStyles.mineNowImage, { transform: [{ scale: mineNowAnim }] }]}
          />
        </TouchableOpacity>
      )}

      {/* Duration Modal */}
      <Modal visible={showDurationModal} transparent animationType="slide">
        <View style={baseStyles.modalOverlay}>
          <LinearGradient colors={[COLORS.darkCard, COLORS.cardBg]} style={baseStyles.modalContent}>
            <Text style={baseStyles.modalTitle}>Select Mining Duration</Text>
            <Text style={baseStyles.modalSubtitle}>Mining will start at 1× multiplier</Text>
            <ScrollView style={baseStyles.optionsList}>
              {durationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[baseStyles.optionItem, selectedHour === option.value && baseStyles.optionItemSelected]}
                  onPress={() => setSelectedHour(option.value)}
                >
                  <Text style={baseStyles.optionText}>{option.label}</Text>
                  <Text style={baseStyles.optionReward}>
                    {(miningRates[1].hourlyReward * option.value).toFixed(2)} tokens
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={baseStyles.modalButtons}>
              <TouchableOpacity style={[baseStyles.modalButton, baseStyles.cancelButton]} onPress={() => setShowDurationModal(false)}>
                <Text style={baseStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[baseStyles.modalButton, baseStyles.confirmButton]} onPress={handleDurationConfirm}>
                <Text style={baseStyles.confirmButtonText}>Start Mining</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </ImageBackground>
  );
};

/* ===================================== */
/* ==========   STYLES  ================ */
/* ===================================== */

const localStyles = StyleSheet.create({
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: '#00FFFF',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 56,
    zIndex: 10,
  },

  avatarLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderRadius: 30,
    padding: 5,
    borderWidth: 1,
    borderColor: '#00FFFF',
  },

  avatarImage: { width: 30, height: 30, borderRadius: 20 },

  avatarTextContainer: { marginLeft: 10, justifyContent: 'center' },

  avatarTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: '#00FFFF',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 56,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },

  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  dashboardTitle: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    color: '#00FFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#00FFFF',
    textShadowRadius: 10,
    zIndex: 5,
  },

  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 160,
    zIndex: 5,
  },

  balanceImage: { width: 310, height: 180, resizeMode: 'contain' },

  balanceTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  totalBalanceLabel: { color: '#9ae6ff', fontSize: 14, fontWeight: '600', marginBottom: 4 },

  balanceText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

  /* Action Buttons Row */
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 15,
  },

  leaderboardButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  leaderboardButtonText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },

  /* WATCH ADS — Static image with pulse */
  watchAdsButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  watchAdsButtonImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
  },

  /* Mining Buttons */
  mineNowContainer: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  mineNowImage: { width: 280, height: 130, resizeMode: 'contain' },

  claimRewardButton: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    zIndex: 10,
  },

  claimGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },

  claimRewardText: { color: '#000', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
});

export default HomeScreen;
