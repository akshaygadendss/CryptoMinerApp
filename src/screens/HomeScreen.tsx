/* FULL UPDATED FILE WITH SEPARATE LEADERBOARD + ADS BUTTON STYLES */

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
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

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

  // Pulse animation for buttons
  const [adsPulseAnim] = useState(new Animated.Value(1));

  // NEW — Banner visibility state
  const [showBanner, setShowBanner] = useState(true);

  const walletAnimRef = useRef<LottieView>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();

      // NEW — show banner again every time user returns to this screen
      setShowBanner(true);

      return undefined;
    }, [])
  );

  // Balance bump effect
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

  // Mine Now pulse
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

  // Pulse for Ads & Leaderboard buttons
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
      const msg = error.response?.data?.error || error.message;
      showErrorToast(msg);
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
      showSuccessToast(`Mining started for ${selectedHour} hour(s)!`);
      navigation.navigate('Mining');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      showErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('wallet');
    showInfoToast('Logged Out');
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

      {/* Avatar */}
      <View style={localStyles.avatarCard}>
        <View style={localStyles.avatarLeft}>
          <Image source={require('../../assets/images/homescreen/avatar.png')} style={localStyles.avatarImage} />
        </View>
        <View style={localStyles.avatarTextContainer}>
          <Text style={localStyles.avatarTitle}>
            {user?.wallet ? `${user.wallet.slice(0, 6)}....` : 'MINER'}
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={localStyles.logoutButton} onPress={handleLogout}>
        <Text style={localStyles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* Dashboard Title */}
      <Text style={localStyles.dashboardTitle}>Dashboard</Text>

      {/* Balance */}
      <View style={localStyles.balanceContainer}>
        <Image source={require('../../assets/images/homescreen/balance.png')} style={localStyles.balanceImage} />
        <View style={localStyles.balanceTextContainer}>
          <Text style={localStyles.totalBalanceLabel}>Total Balance</Text>
          <Animated.Text style={[localStyles.balanceText, { transform: [{ scale: balanceAnim }] }]}>
            {totalBalance.toFixed(4)} TOKENS
          </Animated.Text>
        </View>
      </View>

      {/* Banner Ad with Close Button */}
      {showBanner && (
        <View style={{ alignItems: 'center', marginVertical: 2 }}>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowBanner(false)}
            style={{
              position: 'absolute',
              top: -10,
              right: 10,
              zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>

          <BannerAd
            unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-3644060799052014/8537781821'}
            size={BannerAdSize.LARGE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}

      {/* ACTION BUTTONS */}
      <View style={localStyles.actionButtonsContainer}>

        {/* Leaderboard Button */}
        <Animated.View style={[localStyles.leaderboardWrapper, { transform: [{ scale: adsPulseAnim }] }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.75}
            style={localStyles.leaderboardContainer}
          >
            <Image
              source={require('../../assets/images/homescreen/leaderboard_button.png')}
              style={localStyles.leaderboardImage}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Watch Ads Button */}
        <Animated.View style={[localStyles.adsWrapper, { transform: [{ scale: adsPulseAnim }] }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WatchAds')}
            activeOpacity={0.75}
            style={localStyles.adsContainer}
          >
            <Image
              source={require('../../assets/images/homescreen/ad_button.png')}
              style={localStyles.adsImage}
            />
          </TouchableOpacity>
        </Animated.View>

      </View>

      {/* Mine or Claim */}
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
            <ScrollView>
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


/* ===================================================================================== */
/*                                      STYLES                                           */
/* ===================================================================================== */

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

  avatarTextContainer: { marginLeft: 10 },

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
  },

  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 160,
  },

  balanceImage: { width: 310, height: 180, resizeMode: 'contain' },

  balanceTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },

  totalBalanceLabel: { color: '#9ae6ff', fontSize: 14, fontWeight: '600' },

  balanceText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },

  /* Buttons row */
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    gap: 25,
  },

  leaderboardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  leaderboardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  leaderboardImage: {
    width: 155,
    height: 160,
    resizeMode: 'contain',
  },

  adsWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  adsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  adsImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
  },

  mineNowContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },

  mineNowImage: {
    width: 280,
    height: 130,
    resizeMode: 'contain',
  },

  claimRewardButton: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
  },

  claimGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },

  claimRewardText: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
  },

});

export default HomeScreen;
