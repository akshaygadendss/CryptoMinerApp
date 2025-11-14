import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
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
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<ReferralNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string>('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) {
        setWallet(storedWallet);
        const data = await api.getReferralNotifications(storedWallet);
        setNotifications(data.notifications);
      } else {
        navigation.replace('Signup');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load notifications';
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: ReferralNotification }) => {
    const date = new Date(item.claimedAt).toLocaleDateString();
    const time = new Date(item.claimedAt).toLocaleTimeString();

    return (
      <View style={styles.notificationCard}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎁</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Referral Reward Earned!</Text>
          <Text style={styles.message}>
            <Text style={styles.highlight}>{item.referredWallet.slice(0, 8)}...</Text>
            {' '}used your referral code
          </Text>
          <Text style={styles.reward}>+{item.rewardTokens} TOKENS</Text>
          <Text style={styles.timestamp}>{date} at {time}</Text>
        </View>
      </View>
    );
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
        </View>

        {/* SIMPLE • SMALL • MATCHES BACK BUTTON STYLE */}
        {notifications.length > 0 && (
          <View style={styles.totalRewardsSimpleCard}>
            <Text style={styles.totalRewardsSimpleText}>
              Total Referral Rewards: {notifications.length * 200} Tokens
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
    marginRight: 15,
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
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 10,
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
