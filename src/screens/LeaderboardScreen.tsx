import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { showErrorToast } from '../utils/toast';

interface LeaderboardEntry {
  wallet: string;
  totalEarned: number;
  rank: number;
}

interface LeaderboardScreenProps {
  navigation: any;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserWallet, setCurrentUserWallet] = useState<string>('');

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

    // ✅ Each row now has leaderboard_card.png as background
    return (
      <ImageBackground
        source={require('../../assets/images/leaderboard/leaderboard_card.png')}
        style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}
        imageStyle={styles.cardBackgroundImage} // styling for image itself
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
          {item.totalEarned.toFixed(2)}
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
        <ActivityIndicator size="large" color={COLORS.cyan} />
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
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']} style={styles.overlay}>
        <View style={styles.statueContainer}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonOverlay}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Statue */}
          <Image
            source={require('../../assets/images/leaderboard/statue.png')}
            style={styles.statueImage}
            resizeMode="contain"
          />

          {/* 🔹 Leaderboard Title on Statue */}
          <Text style={styles.leaderboardTitle}>Leaderboard</Text>

          {/* Top 2 users (Hexagons) */}
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
                    <Text style={styles.topTokenText}>{user.totalEarned.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 🔹 Scrollable Leaderboard List (Ranks 3 and beyond) */}
          <View style={styles.listWrapper}>
            <FlatList
              data={leaderboard.slice(2)} // start from 3rd rank
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.wallet}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              initialNumToRender={4}
              scrollEnabled={true}
            />
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center' },
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
  backButtonOverlay: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  backButtonText: {
    color: COLORS.cyan,
    fontSize: 16,
    fontWeight: '600',
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

  /* 🔹 Leaderboard List Section */
  listWrapper: {
    width: '75%',
    height: 220, // shows ~4 items
    position: 'absolute',
    bottom: '14%',
    zIndex: 2,
  },
  listContent: {
    paddingBottom: 20,
  },

  /* 🔹 Each Row with Background Card */
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden', // ensures background fits rounded corners
  },
  cardBackgroundImage: {
    borderRadius: 10,
    opacity: 0.95, // slight transparency for visual depth
  },
  currentUserItem: {
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    borderRadius: 10,
  },
  rankText: {
    color: '#FFD700',
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
