import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { showErrorToast } from '../utils/toast';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useFocusEffect } from '@react-navigation/native';

interface LeaderboardEntry {
  wallet: string;
  totalEarned: number;
  totalAdRewards: number;
  totalBalance: number;
  rank: number;
}

interface LeaderboardScreenProps {
  navigation: any;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserWallet, setCurrentUserWallet] = useState<string>('');

  // NEW — Banner visibility
  const [showBanner, setShowBanner] = useState(true);

  // Show banner again whenever user visits this screen
  useFocusEffect(
    React.useCallback(() => {
      setShowBanner(true);
      return () => {};
    }, [])
  );

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const wallet = await api.getStoredWallet();
      if (wallet) setCurrentUserWallet(wallet);

      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to load leaderboard';
      showErrorToast(errorMessage, 'Error');
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.wallet === currentUserWallet;
    const medalEmoji =
      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';

    return (
      <ImageBackground
        source={require('../../assets/images/leaderboard/leaderboard_card.png')}
        style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}
        imageStyle={styles.cardBackgroundImage}
        resizeMode="stretch"
      >
        <Text style={styles.rankText}>{medalEmoji || `#${item.rank}`}</Text>
        <Text
          style={[styles.walletText, isCurrentUser && styles.currentUserText]}
          numberOfLines={1}
        >
          {item.wallet.length > 12
            ? `${item.wallet.slice(0, 8)}....${item.wallet.slice(-4)}`
            : item.wallet}
        </Text>
        <Text style={[styles.tokensText, isCurrentUser && styles.currentUserText]}>
          {item.totalBalance.toFixed(2)}
        </Text>
      </ImageBackground>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
        style={styles.container}
      >
        <LottieView
          source={require('../../assets/Animations/Loading_circles.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      </LinearGradient>
    );
  }

  const topTwo = leaderboard.slice(0, 2);

  return (
    <ImageBackground
      source={require('../../assets/images/homescreen/bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
     <LinearGradient
  colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
  style={styles.overlay}
>
  {/* FIXED BACK BUTTON (OUTSIDE ALL CONTAINERS) */}
  <View style={styles.backButtonWrapper}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Text style={styles.backButtonText}>←Back</Text>
    </TouchableOpacity>
  </View>


        <View style={styles.statueContainer}>
          {/* Statue */}
          <Image
            source={require('../../assets/images/leaderboard/statue.png')}
            style={styles.statueImage}
            resizeMode="contain"
          />

          {/* Leaderboard Title */}
          <Text style={styles.leaderboardTitle}>Leaderboard</Text>

          {/* Top 2 */}
          {topTwo.length > 0 && (
            <View style={styles.topTwoContainer}>
              {topTwo.map((user, index) => (
                <View key={user.wallet} style={styles.hexagonWrapper}>
                  <Image
                    source={
                      index === 0
                        ? require('../../assets/images/leaderboard/hexa_golden.png')
                        : require('../../assets/images/leaderboard/hexa_silver.png')
                    }
                    style={styles.hexagonImage}
                    resizeMode="contain"
                  />
                  <View style={styles.hexagonContent}>
                    <Text style={styles.topRankText}>
                      {index + 1 === 1 ? '🥇' : '🥈'}
                    </Text>
                    <Text style={styles.topUserText} numberOfLines={1}>
                      {user.wallet.length > 10
                        ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-3)}`
                        : user.wallet}
                    </Text>
                    <Text style={styles.topTokenText}>{user.totalBalance.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Leaderboard List */}
          <View style={styles.listWrapper}>
            <FlatList
              data={leaderboard.slice(2)}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.wallet}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              initialNumToRender={4}
              scrollEnabled={true}
            />
          </View>
        </View>

        {/* Banner Ad with Close Button */}
        {showBanner && (
          <View
            style={{
              position: 'absolute',
              bottom: 15,
              width: '100%',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowBanner(false)}
              style={{
                position: 'absolute',
                top: -30,
                right: 10,
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 4,
                borderRadius: 12,
                zIndex: 20,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>

            <BannerAd
              unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-3644060799052014/8537781821'}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          </View>
        )}
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  overlay: { flex: 1, alignItems: 'center' },
  backButtonWrapper: {
  position: 'absolute',
  top: 40,
  left: -180, // pushes it more left
  zIndex: 100,
},

backButton: {
  backgroundColor: 'rgba(0,0,0,0.6)',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: COLORS.cyan,
},

backButtonText: {
  color: COLORS.text,
  fontSize: 18,
  fontWeight: '700',
},

  statueContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  statueImage: {
    width: '150%',
    height: '115%',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  leaderboardTitle: {
    position: 'absolute',
    top: '44%',
    zIndex: 4,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  topTwoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '80%',
    position: 'absolute',
    top: '38%',
    zIndex: 3,
  },
  hexagonWrapper: {
    alignItems: 'center',
    marginHorizontal: 55,
  },
  hexagonImage: {
    width: 130,
    height: 130,
  },
  hexagonContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 22,
    width: 90,
  },
  topRankText: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  topUserText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  topTokenText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  listWrapper: {
    width: '75%',
    height: 220,
    position: 'absolute',
    bottom: '14%',
    zIndex: 2,
  },
  listContent: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    borderRadius: 10,
    opacity: 0.95,
  },
  currentUserItem: {
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    borderRadius: 10,
  },
  rankText: {
    color: '#f9f8f5ff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 50,
  },
  walletText: {
    flex: 1,
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  currentUserText: { color: '#FFD700' },
  tokensText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
});

export default LeaderboardScreen;
