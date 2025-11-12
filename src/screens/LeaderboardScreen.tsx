import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
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
      if (wallet) {
        setCurrentUserWallet(wallet);
      }
      
      // Fetch leaderboard data from API
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load leaderboard';
      showErrorToast(errorMessage, 'Error');
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.wallet === currentUserWallet;
    const medalEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>
            {medalEmoji || `#${item.rank}`}
          </Text>
        </View>
        <View style={styles.walletContainer}>
          <Text style={[styles.walletText, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
            {item.wallet.length > 12 ? `${item.wallet.slice(0, 8)}....${item.wallet.slice(-4)}` : item.wallet}
          </Text>
          {isCurrentUser && <Text style={styles.youBadge}>YOU</Text>}
        </View>
        <Text style={[styles.tokensText, isCurrentUser && styles.currentUserText]}>
          {item.totalEarned.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]} style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </LinearGradient>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/homescreen/bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
        style={styles.overlay}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 LEADERBOARD</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Leaderboard List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Rank</Text>
            <Text style={[styles.listHeaderText, { flex: 1 }]}>Wallet</Text>
            <Text style={styles.listHeaderText}>Tokens</Text>
          </View>

          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.wallet}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: COLORS.cyan,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  placeholder: {
    width: 60,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,255,255,0.2)',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.cyan,
  },
  listHeaderText: {
    color: COLORS.cyan,
    fontSize: 14,
    fontWeight: 'bold',
    width: 60,
  },
  listContent: {
    paddingVertical: 10,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,255,0.1)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(0,255,255,0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  currentUserText: {
    color: '#FFD700',
  },
  youBadge: {
    marginLeft: 8,
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokensText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
});

export default LeaderboardScreen;
