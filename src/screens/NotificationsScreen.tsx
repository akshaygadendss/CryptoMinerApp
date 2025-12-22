import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { showErrorToast } from '../utils/toast';
import { globalStyles } from '../styles/global';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

interface NotificationsScreenProps {
  navigation: any;
}

interface ReferralNotification {
  _id: string;
  referrerWallet: string;
  referredWallet: string;
  rewardTokens: number;
  claimedAt: string;
  type: 'signup';
}

interface MiningRewardNotification {
  _id: string;
  referrerWallet: string;
  referredWallet: string;
  session10percentTokens: number;
  claimedAt: string;
  type: 'mining';
}

type CombinedNotification = ReferralNotification | MiningRewardNotification;

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<CombinedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<string>('');
  const [totalReferralRewards, setTotalReferralRewards] = useState<number>(0);
  const [connectionError, setConnectionError] = useState<string>('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setConnectionError('');
      console.log('[NotificationsScreen] Starting to load notifications...');
      
      const storedWallet = await api.getStoredWallet();
      console.log('[NotificationsScreen] Stored wallet:', storedWallet);
      
      if (storedWallet) {
        setWallet(storedWallet);
        
        console.log('[NotificationsScreen] Fetching referral notifications...');
        // Fetch both types of notifications with individual error handling
        let referralData = { notifications: [], count: 0 };
        let miningData = { miningRewards: [], totalMiningRewards: 0, count: 0 };
        let hasError = false;
        
        try {
          referralData = await api.getReferralNotifications(storedWallet);
          console.log('[NotificationsScreen] Referral data received:', referralData);
        } catch (error: any) {
          console.error('[NotificationsScreen] Error fetching referral notifications:', error.message);
          hasError = true;
          setConnectionError('Unable to fetch some notifications. Please check your connection.');
          // Continue with empty data instead of failing completely
        }
        
        try {
          console.log('[NotificationsScreen] Fetching mining rewards...');
          miningData = await api.getReferralMiningRewards(storedWallet);
          console.log('[NotificationsScreen] Mining data received:', miningData);
        } catch (error: any) {
          console.error('[NotificationsScreen] Error fetching mining rewards:', error.message);
          hasError = true;
          setConnectionError('Unable to fetch some notifications. Please check your connection.');
          // Continue with empty data instead of failing completely
        }
        
        // Mark each notification with its type
        const signupNotifications: ReferralNotification[] = (referralData.notifications || []).map(n => ({
          ...n,
          type: 'signup' as const
        }));
        
        const miningNotifications: MiningRewardNotification[] = (miningData.miningRewards || []).map(n => ({
          ...n,
          type: 'mining' as const
        }));
        
        // Combine and sort by date
        const combined = [...signupNotifications, ...miningNotifications].sort((a, b) => 
          new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()
        );
        
        console.log('[NotificationsScreen] Combined notifications:', combined.length);
        setNotifications(combined);
        
        // Calculate total rewards
        const signupTotal = (referralData.notifications || []).reduce((sum, n) => sum + (n.rewardTokens || 0), 0);
        const miningTotal = miningData.totalMiningRewards || 0;
        const totalRewards = signupTotal + miningTotal;
        console.log('[NotificationsScreen] Total rewards calculated:', { signupTotal, miningTotal, totalRewards });
        setTotalReferralRewards(totalRewards);
        
        if (!hasError) {
          setConnectionError('');
        }
      } else {
        console.log('[NotificationsScreen] No wallet found, redirecting to Signup');
        navigation.replace('Signup');
      }
    } catch (error: any) {
      console.error('[NotificationsScreen] General error in loadNotifications:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load notifications';
      setConnectionError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: CombinedNotification }) => {
    const claimedAt = item.claimedAt || new Date().toISOString();
    const date = new Date(claimedAt).toLocaleDateString();
    const time = new Date(claimedAt).toLocaleTimeString();

    if (item.type === 'signup') {
      return (
        <View style={styles.notificationCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎁</Text>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Referral Signup Reward!</Text>
            <Text style={styles.message}>
              <Text style={styles.highlight}>{(item.referredWallet || '').slice(0, 8)}...</Text>
              {' '}used your referral code
            </Text>
            <Text style={styles.reward}>+{item.rewardTokens || 0} TOKENS</Text>
            <Text style={styles.timestamp}>{date} at {time}</Text>
          </View>
        </View>
      );
    } else {
      // Mining reward notification
      return (
        <View style={styles.notificationCard}>
          <View style={[styles.iconContainer, styles.miningIconContainer]}>
            <Text style={styles.icon}>⛏️</Text>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Mining Referral Reward!</Text>
            <Text style={styles.message}>
              <Text style={styles.highlight}>{(item.referredWallet || '').slice(0, 8)}...</Text>
              {' '}completed a mining session
            </Text>
            <Text style={styles.reward}>+{(item.session10percentTokens || 0).toFixed(4)} TOKENS (10%)</Text>
            <Text style={styles.timestamp}>{date} at {time}</Text>
          </View>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/images/miningScreen/bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/miningScreen/bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔔 Notifications</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadNotifications}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Error Banner */}
        {connectionError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {connectionError}</Text>
            <TouchableOpacity onPress={loadNotifications} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SIMPLE • SMALL • MATCHES BACK BUTTON STYLE */}
        {notifications.length > 0 && (
          <View style={styles.totalRewardsSimpleCard}>
            <Text style={styles.totalRewardsSimpleText}>
              Total Referral Rewards: {totalReferralRewards.toFixed(4)} Tokens
            </Text>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Share your referral code to earn rewards!
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.cyan}
                colors={[COLORS.cyan]}
              />
            }
          />
        )}
      </View>

      <View style={globalStyles.bannerAdContainerBottom}>
        <BannerAd
          unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-3644060799052014/8537781821'}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  refreshButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  refreshButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 10,
  },

  /* Error Banner */
  errorBanner: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6666',
    flex: 1,
    marginRight: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  retryButtonText: {
    color: '#ff6666',
    fontSize: 12,
    fontWeight: '600',
  },

  /* NEW SIMPLE TOTAL REWARDS CARD */
  totalRewardsSimpleCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalRewardsSimpleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  listContent: {
    paddingBottom: 100,
  },

  notificationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.cyan,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miningIconContainer: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  icon: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  highlight: {
    color: COLORS.cyan,
    fontWeight: 'bold',
  },
  reward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
