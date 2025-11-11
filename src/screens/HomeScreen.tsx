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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { COLORS } from '../constants/mining';
import api, { User, UserSummary } from '../services/api';
import { useConfig } from '../hooks/useConfig';
import { styles } from './HomeScreen.styles';
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
  const [userIconAnim] = useState(new Animated.Value(0));
  const [statusAnim] = useState(new Animated.Value(1));
  const walletAnimRef = useRef<LottieView>(null);

  useEffect(() => {
    loadUserData();

    // Animate user icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(userIconAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(userIconAnim, {
          toValue: -1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(userIconAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh user data on focus to reflect latest balance/status
      loadUserData();
      return undefined;
    }, [])
  );

  useEffect(() => {
    if (user) {
      // Animate balance change
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

  useEffect(() => {
    if (user?.status === 'mining' || user?.status === 'ready_to_claim') {
      // Pulse animation for status
      Animated.loop(
        Animated.sequence([
          Animated.timing(statusAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(statusAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [user?.status]);

  const userIconRotation = userIconAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const loadUserData = async () => {
    try {
      console.log('[HomeScreen] Loading user data...');
      const wallet = await api.getStoredWallet();
      if (!wallet) {
        console.log('[HomeScreen] No wallet found, redirecting to Signup');
        navigation.replace('Signup');
        return;
      }
      console.log('[HomeScreen] Fetching user data for wallet:', wallet);
      const userData = await api.getUser(wallet);
      console.log('[HomeScreen] User data loaded:', userData);
      setUser(userData);
      try {
        const summary: UserSummary = await api.getUserSummary(wallet);
        setTotalBalance(summary.totalEarnedSum || 0);
      } catch (e) {
        console.warn('[HomeScreen] Failed to fetch summary, fallback to latest user.totalEarned');
        setTotalBalance(userData?.totalEarned || 0);
      }
    } catch (error: any) {
      console.error('[HomeScreen] Failed to load user data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load user data';
      showErrorToast(errorMessage, 'Error Loading Data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMining = () => {
    if (user?.status === 'mining') {
      navigation.navigate('Mining');
    } else if (user?.status === 'ready_to_claim') {
      showInfoToast('Please claim your previous rewards first', 'Unclaimed Rewards');
      navigation.navigate('Claim');
    } else {
      setShowDurationModal(true);
    }
  };

  const handleDurationConfirm = async () => {
    if (!user) return;
    setShowDurationModal(false);
    setLoading(true);

    try {
      console.log('[HomeScreen] Starting mining:', {
        wallet: user.wallet,
        selectedHour,
        multiplier: 1,
      });
      await api.startMining(user.wallet, selectedHour, 1);
      console.log('[HomeScreen] Mining started successfully, navigating to Mining screen');
      showSuccessToast(`Mining started for ${selectedHour} hour(s)! ⛏️`, 'Mining Started');
      navigation.navigate('Mining');
    } catch (error: any) {
      console.error('[HomeScreen] Failed to start mining:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start mining';
      showErrorToast(errorMessage, 'Mining Failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = () => {
    if (!user) return 'INACTIVE';
    if (user.status === 'mining') return 'MINING';
    if (user.status === 'ready_to_claim') return 'READY!';
    if (user.status === 'claimed') return 'INACTIVE';
    return 'INACTIVE';
  };

  const getStatusColor = () => {
    if (!user) return COLORS.slate;
    if (user.status === 'mining') return COLORS.green;
    if (user.status === 'ready_to_claim') return COLORS.yellow;
    return COLORS.slate;
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('wallet');
      showInfoToast('You have been logged out', 'Goodbye! 👋');
    } catch { }
    navigation.replace('Signup');
  };

  if (loading || configLoading || !miningRates || !durationOptions) {
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

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar - Wallet Info */}
        <View style={styles.topBar}>
          <View style={styles.leftRow}>
            <View style={styles.walletInfo}>
              <Animated.View
                style={[
                  styles.userIcon,
                  {
                    transform: [{ rotate: userIconRotation }],
                  },
                ]}
              >
                <Text style={styles.userIconText}>👤</Text>
              </Animated.View>
              <View style={styles.walletTextContainer}>
                <Text style={styles.walletLabel}>MINER</Text>
                <Text style={styles.walletId} numberOfLines={1} ellipsizeMode="middle">
                  {user?.wallet || 'Loading...'}
                </Text>
              </View>
            </View>

            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDotSmall,
                  { backgroundColor: getStatusColor() },
                ]}
              />
              <Text
                style={[
                  styles.statusTextSmall,
                  { color: getStatusColor() },
                ]}
              >
                {getStatusText()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.awardButton}
            onPress={handleLogout}
          >
            <Text style={styles.awardIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>MINING DASHBOARD</Text>

        {/* Balance - Hero Section */}
        <Animated.View
          style={[
            styles.balanceCard,
            {
              transform: [{ scale: balanceAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCardInner}
          >
            <View style={styles.walletAnimContainer}>
              <LottieView
                ref={walletAnimRef}
                source={require('../../assets/Animations/Wallet.json')}
                autoPlay
                loop
                style={styles.walletAnim}
              />
            </View>

            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text style={styles.balanceAmount}>
              {totalBalance.toFixed(4)}
            </Text>
            <Text style={styles.balanceUnit}>TOKENS</Text>
          </LinearGradient>
        </Animated.View>

        {/* Mining Control Center */}
        <TouchableOpacity
          activeOpacity={user?.status === 'mining' ? 0.8 : 1}
          onPress={() => {
            if (user?.status === 'mining') {
              navigation.navigate('Mining');
            }
          }}
          style={styles.controlCard}
        >
          <View style={styles.controlHeader}>
            <Text style={styles.controlIcon}>⛏️</Text>
            <Text style={styles.controlTitle}>MINING CONTROL</Text>
          </View>

          {(user?.status !== 'mining' && user?.status !== 'ready_to_claim') && (
            <>
              <Text style={styles.controlSubtext}>
                Start a new mining session to earn tokens!
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartMining}
              >
                <Text style={styles.startButtonIcon}>⛏️</Text>
                <Text style={styles.startButtonText}>START MINING SESSION</Text>
              </TouchableOpacity>
            </>
          )}

          {user?.status === 'mining' && (
            <View style={styles.miningStatusContainer}>
              <Animated.View
                style={[
                  styles.miningIcon,
                  {
                    transform: [
                      {
                        rotate: statusAnim.interpolate({
                          inputRange: [0.6, 1],
                          outputRange: ['-15deg', '15deg'],
                        }),
                      },
                      {
                        translateY: statusAnim.interpolate({
                          inputRange: [0.6, 1],
                          outputRange: [-5, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.miningIconText}>⛏️</Text>
              </Animated.View>
              <Text style={styles.miningStatusText}>Mining in progress...</Text>
              <Text style={styles.miningStatusSubtext}>
                Tap to view details
              </Text>
            </View>
          )}

          {user?.status === 'ready_to_claim' && (
            <>
              <Animated.View
                style={[
                  styles.trophyIcon,
                  {
                    transform: [
                      {
                        rotate: statusAnim.interpolate({
                          inputRange: [0.6, 1],
                          outputRange: ['-10deg', '10deg'],
                        }),
                      },
                      {
                        scale: statusAnim.interpolate({
                          inputRange: [0.6, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.trophyIconText}>🏆</Text>
              </Animated.View>
              <Text style={styles.claimText}>
                🎉 Mining Complete! Claim your rewards now!
              </Text>
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => navigation.navigate('Claim')}
              >
                <Text style={styles.claimButtonIcon}>🏆</Text>
                <Text style={styles.claimButtonText}>CLAIM REWARDS</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Duration Selection Modal */}
      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[COLORS.darkCard, COLORS.cardBg]}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Select Mining Duration</Text>
            <Text style={styles.modalSubtitle}>Mining will start at 1× multiplier</Text>
            <Text style={styles.modalInfo}>
              You can upgrade multiplier during mining by watching ads
            </Text>

            <ScrollView style={styles.optionsList}>
              {durationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedHour === option.value && styles.optionItemSelected
                  ]}
                  onPress={() => setSelectedHour(option.value)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Text style={styles.optionReward}>
                    {(miningRates[1].hourlyReward * option.value).toFixed(2)} tokens
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDurationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDurationConfirm}
              >
                <Text style={styles.confirmButtonText}>Start Session</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;