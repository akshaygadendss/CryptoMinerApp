import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS, DURATION_OPTIONS, MINING_RATES } from '../constants/mining';
import api, { User } from '../services/api';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showMultiplierModal, setShowMultiplierModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);

  useEffect(() => {
    loadUserData();
  }, []);

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
      navigation.navigate('Claim');
    } else {
      setShowDurationModal(true);
    }
  };

  const handleDurationNext = () => {
    setShowDurationModal(false);
    setShowMultiplierModal(true);
  };

  const confirmMining = async () => {
    if (!user) return;
    
    setShowMultiplierModal(false);
    setLoading(true);
    
    try {
      console.log('[HomeScreen] Starting mining:', {
        wallet: user.wallet,
        selectedHour,
        multiplier: selectedMultiplier
      });
      await api.startMining(user.wallet, selectedHour, selectedMultiplier);
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

  const getButtonText = () => {
    if (!user) return 'Loading...';
    if (user.status === 'mining') return 'Continue Mining';
    if (user.status === 'ready_to_claim') return 'Claim Rewards';
    return 'Start Mining';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.walletContainer}>
        <Text style={styles.walletLabel}>Wallet ID</Text>
        <Text style={styles.walletId} numberOfLines={1} ellipsizeMode="middle">
          {user?.wallet || 'Loading...'}
        </Text>
      </View>

      <Image
        source={require('../../assets/logo.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title}>Mining Village</Text>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {user?.totalEarned.toFixed(4) || '0.0000'}
          </Text>
          <Text style={styles.balanceUnit}>Tokens</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Mining Status</Text>
          <View style={[
            styles.statusBadge,
            user?.status === 'mining' && styles.statusBadgeActive
          ]}>
            <Text style={styles.statusText}>
              {user?.status === 'mining' ? 'ACTIVE' : 
               user?.status === 'ready_to_claim' ? 'READY' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleStartMining}
        >
          <Text style={styles.mainButtonText}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>

      {/* Duration Selection Modal */}
      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Mining Duration</Text>
            <Text style={styles.modalSubtitle}>Choose how long you want to mine</Text>
            
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
                  <View style={styles.optionLeft}>
                    <Text style={[
                      styles.optionText,
                      selectedHour === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={[
                      styles.optionReward,
                      selectedHour === option.value && styles.optionRewardSelected
                    ]}>
                      {(MINING_RATES[1].hourlyReward * option.value).toFixed(0)} tokens
                    </Text>
                  </View>
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
                onPress={handleDurationNext}
              >
                <Text style={styles.confirmButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Multiplier Selection Modal */}
      <Modal
        visible={showMultiplierModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Multiplier</Text>
            <Text style={styles.modalSubtitle}>
              Higher multipliers earn more tokens per hour
            </Text>
            <Text style={styles.modalInfo}>
              💡 You can upgrade multiplier later by watching ads
            </Text>
            
            <ScrollView style={styles.multiplierList}>
              {[1, 2, 3, 4, 5, 6].map((mult) => (
                <TouchableOpacity
                  key={mult}
                  style={[
                    styles.multiplierCard,
                    selectedMultiplier === mult && styles.multiplierCardSelected
                  ]}
                  onPress={() => setSelectedMultiplier(mult)}
                >
                  <View style={styles.multiplierHeader}>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierBadgeText}>{mult}×</Text>
                    </View>
                    {selectedMultiplier === mult && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.multiplierBody}>
                    <Text style={styles.multiplierRate}>
                      {MINING_RATES[mult].hourlyReward.toFixed(0)} tokens/hour
                    </Text>
                    <Text style={styles.multiplierTotal}>
                      Total: {(MINING_RATES[mult].hourlyReward * selectedHour).toFixed(0)} tokens
                    </Text>
                  </View>

                  {mult > 1 && (
                    <View style={styles.adRequirement}>
                      <Text style={styles.adRequirementText}>
                        🎬 Requires watching ad
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMultiplierModal(false);
                  setShowDurationModal(true);
                }}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmMining}
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
  walletContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    maxWidth: '60%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  walletLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  walletId: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: COLORS.text,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.bitcoin,
  },
  balanceUnit: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: COLORS.textLight,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
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
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.secondary,
  },
  optionLeft: {
    flex: 1,
  },
  optionRight: {
    alignItems: 'flex-end',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionReward: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  optionRewardSelected: {
    color: '#FFFFFF',
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

export default HomeScreen;