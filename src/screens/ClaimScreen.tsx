import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { COLORS, DURATION_OPTIONS, MINING_RATES } from '../constants/mining';
import api, { User } from '../services/api';

interface ClaimScreenProps {
  navigation: any;
}

const ClaimScreen: React.FC<ClaimScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('[ClaimScreen] Loading user data...');
      const wallet = await api.getStoredWallet();
      if (!wallet) {
        console.log('[ClaimScreen] No wallet found, redirecting to Signup');
        navigation.replace('Signup');
        return;
      }
      console.log('[ClaimScreen] Fetching user data for wallet:', wallet);
      const userData = await api.getUser(wallet);
      console.log('[ClaimScreen] User data loaded:', userData);
      setUser(userData);
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to load user data:', {
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

  const handleClaim = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('[ClaimScreen] Claiming rewards for wallet:', user.wallet);
      await api.claimReward(user.wallet);
      console.log('[ClaimScreen] Rewards claimed successfully');
      setShowDurationModal(true);
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to claim rewards:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim rewards';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startNewMining = async () => {
    if (!user) return;

    setShowDurationModal(false);
    setLoading(true);

    try {
      console.log('[ClaimScreen] Starting new mining session:', {
        wallet: user.wallet,
        selectedHour,
        selectedMultiplier
      });
      await api.startMining(user.wallet, selectedHour, selectedMultiplier);
      console.log('[ClaimScreen] Mining started, navigating to Mining screen');
      navigation.replace('Mining');
    } catch (error: any) {
      console.error('[ClaimScreen] Failed to start mining:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start mining';
      Alert.alert('Error', errorMessage);
      navigation.replace('Home');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎉 Mining Complete!</Text>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardLabel}>Tokens Mined</Text>
          <Text style={styles.rewardAmount}>
            {user.currentMiningPoints.toFixed(4)}
          </Text>
          <Text style={styles.rewardUnit}>Tokens</Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>
            {user.totalEarned.toFixed(4)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.claimButton}
          onPress={handleClaim}
          disabled={loading}
        >
          <Text style={styles.claimButtonText}>
            {loading ? 'Claiming...' : 'Claim Rewards'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Mining Session</Text>

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
                  {(MINING_RATES[selectedMultiplier as keyof typeof MINING_RATES].hourlyReward * option.value).toFixed(2)} tokens
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.modalSubtitle}>Select Multiplier</Text>
            <View style={styles.multiplierContainer}>
              {[1, 2, 3, 4, 5, 6].map((mult) => (
                <TouchableOpacity
                  key={mult}
                  style={[
                    styles.multiplierButton,
                    selectedMultiplier === mult && styles.multiplierButtonSelected
                  ]}
                  onPress={() => setSelectedMultiplier(mult)}
                >
                  <Text style={styles.multiplierText}>{mult}×</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDurationModal(false);
                  navigation.replace('Home');
                }}
              >
                <Text style={styles.cancelButtonText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={startNewMining}
              >
                <Text style={styles.confirmButtonText}>Start Mining</Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.text,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 30,
  },
  rewardCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardLabel: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  rewardAmount: {
    fontSize: 54,
    fontWeight: 'bold',
    color: COLORS.bitcoin,
  },
  rewardUnit: {
    fontSize: 20,
    color: COLORS.textLight,
    marginTop: 5,
  },
  totalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalLabel: {
    fontSize: 18,
    color: COLORS.textLight,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  claimButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: COLORS.textLight,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 10,
  },
  optionItem: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary,
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
  multiplierContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  multiplierButton: {
    width: '30%',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  multiplierButtonSelected: {
    backgroundColor: COLORS.secondary,
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ClaimScreen;
