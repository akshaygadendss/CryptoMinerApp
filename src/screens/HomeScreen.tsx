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

  // Pulse animation for buttons
  const [adsPulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
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

      {/* Top Right Icons */}
      <View style={localStyles.topRightIcons}>
        <TouchableOpacity style={localStyles.iconButton} onPress={() => navigation.navigate('Notifications')}>
          <Text style={localStyles.iconText}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.iconButton} onPress={handleLogout}>
          <Text style={localStyles.iconText}>🚪</Text>
        </TouchableOpacity>
      </View>

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

      {/* Bottom Tabs */}
      <View style={localStyles.bottomTabs}>
        <TouchableOpacity
          style={localStyles.tabButton}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.7}
        >
          <Text style={localStyles.tabIcon}>🏆</Text>
          <Text style={localStyles.tabLabel}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.tabButton}
          onPress={() => navigation.navigate('Referral')}
          activeOpacity={0.7}
        >
          <Text style={localStyles.tabIcon}>🎁</Text>
          <Text style={localStyles.tabLabel}>Referral</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.tabButton}
          onPress={() => navigation.navigate('WatchAds')}
          activeOpacity={0.7}
        >
          <Text style={localStyles.tabIcon}>📺</Text>
          <Text style={localStyles.tabLabel}>Watch Ads</Text>
        </TouchableOpacity>
      </View>

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

  topRightIcons: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 11,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: '#00FFFF',
    borderRadius: 15,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    fontSize: 24,
  },

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
    bottom: 180,
    alignSelf: 'center',
  },

  mineNowImage: {
    width: 280,
    height: 130,
    resizeMode: 'contain',
  },

  claimRewardButton: {
    position: 'absolute',
    bottom: 200,
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

  bottomTabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 2,
    borderTopColor: '#00FFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#00FFFF',
    fontWeight: '600',
  },

});

export default HomeScreen;
