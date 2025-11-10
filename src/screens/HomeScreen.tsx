import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { COLORS, DURATION_OPTIONS, MINING_RATES } from '../constants/mining';
import api, { User, UserSummary } from '../services/api';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(1);
  const [balanceAnim] = useState(new Animated.Value(1));
  const [userIconAnim] = useState(new Animated.Value(0));
  const [statusAnim] = useState(new Animated.Value(1));

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
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMining = () => {
    if (user?.status === 'mining') {
      navigation.navigate('Mining');
    } else if (user?.status === 'ready_to_claim') {
      Alert.alert(
        'Unclaimed Rewards',
        'You have unclaimed rewards from your previous mining session. Please claim them before starting a new session.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Claim Now', onPress: () => navigation.navigate('Claim') }
        ]
      );
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
      navigation.navigate('Mining');
    } catch (error: any) {
      console.error('[HomeScreen] Failed to start mining:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start mining';
      Alert.alert('Error', errorMessage);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
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
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('wallet');
              } catch {}
              navigation.replace('Signup');
            }}
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
          <View style={styles.balanceCardInner}>
            <View style={styles.coinIconContainer}>
              <Animated.View
                style={[
                  styles.coinIcon,
                  {
                    transform: [
                      {
                        rotate: balanceAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.coinIconText}>🪙</Text>
              </Animated.View>
            </View>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text style={styles.balanceAmount}>
              {totalBalance.toFixed(4)}
            </Text>
            <Text style={styles.balanceUnit}>TOKENS</Text>
          </View>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Mining Duration</Text>
            <Text style={styles.modalSubtitle}>Mining will start at 1× multiplier</Text>
            <Text style={styles.modalInfo}>
              You can upgrade multiplier during mining by watching ads
            </Text>
            
            <ScrollView style={styles.optionsList}>
              {DURATION_OPTIONS.map((option) => (
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
                    {(MINING_RATES[1].hourlyReward * option.value).toFixed(2)} tokens
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
                <Text style={styles.confirmButtonText}>Next: Select Multiplier</Text>
              </TouchableOpacity>
            </View>
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
    padding: 16,
    zIndex: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '65%',
    marginRight: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    marginLeft: 0,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cyan,
    borderWidth: 2,
    borderColor: COLORS.cyanLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userIconText: {
    fontSize: 18,
  },
  walletTextContainer: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  walletId: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
    maxWidth: '100%',
  },
  awardButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.orange,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  awardIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 32,
  },
  balanceCard: {
    marginBottom: 24,
  },
  balanceCardInner: {
    backgroundColor: COLORS.orange,
    borderRadius: 24,
    padding: 32,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  coinIconContainer: {
    marginBottom: 16,
  },
  coinIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinIconText: {
    fontSize: 48,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  balanceUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 4,
    borderColor: COLORS.cyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 8,
  },
  earningsCard: {
    borderColor: COLORS.orange,
    marginRight: 0,
    marginLeft: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 12,
    color: COLORS.slate,
  },
  controlCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    borderWidth: 4,
    borderColor: COLORS.cyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  controlIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.cyan,
  },
  controlSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderColor: COLORS.cyanLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkCard,
  },
  miningStatusContainer: {
    alignItems: 'center',
  },
  miningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green,
    borderWidth: 4,
    borderColor: COLORS.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  miningIconText: {
    fontSize: 40,
  },
  miningStatusText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
    marginBottom: 8,
  },
  miningStatusSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  trophyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.yellow,
    borderWidth: 4,
    borderColor: COLORS.yellowLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  trophyIconText: {
    fontSize: 40,
  },
  claimText: {
    fontSize: 16,
    color: COLORS.yellow,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
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
  },
  claimButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
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
    maxHeight: '80%',
    borderWidth: 4,
    borderColor: COLORS.cyan,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.cyan,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    backgroundColor: COLORS.darkCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.slate,
  },
  optionItemSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyanLight,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionReward: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.darkCard,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
