import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';
import { globalStyles } from '../styles/global';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

interface ReferralScreenProps {
  navigation: any;
}

const ReferralScreen: React.FC<ReferralScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState<string>('');
  const [myReferralCode, setMyReferralCode] = useState<string>('');
  const [inputReferralCode, setInputReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [checkingReferral, setCheckingReferral] = useState(true);

  useEffect(() => {
    loadWalletAndCheckReferral();
  }, []);

  const loadWalletAndCheckReferral = async () => {
    try {
      const storedWallet = await api.getStoredWallet();
      if (storedWallet) {
        setWallet(storedWallet);
        
        // Get user's referral code
        const codeData = await api.getReferralCode(storedWallet);
        setMyReferralCode(codeData.referralCode);
        
        // Check if user has already used a referral code
        const referralStatus = await api.checkReferral(storedWallet);
        setHasUsedReferral(referralStatus.hasUsedReferral);
      } else {
        navigation.replace('Signup');
      }
    } catch (error) {
      console.error('[ReferralScreen] Failed to load wallet:', error);
    } finally {
      setCheckingReferral(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!inputReferralCode.trim()) {
      showErrorToast('Please enter a referral code');
      return;
    }

    if (!wallet) {
      showErrorToast('Wallet not found');
      return;
    }

    setLoading(true);
    try {
      const result = await api.applyReferralCode(wallet, inputReferralCode.trim().toUpperCase());
      showSuccessToast(`Referral applied! ${result.rewardedTokens} tokens added to referrer!`);
      setHasUsedReferral(true);
      setInputReferralCode('');
      
      // Navigate back to home after 2 seconds
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to apply referral code';
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShareReferral = async () => {
    if (!myReferralCode) return;

    try {
      await Share.share({
        message: `Join CryptoMiner and use my referral code to get started!\n\nReferral Code: ${myReferralCode}\n\nDownload the app now!`,
        title: 'Join CryptoMiner',
      });
    } catch (error) {
      console.error('[ReferralScreen] Share error:', error);
    }
  };

  const handleCopyReferral = () => {
    if (!myReferralCode) return;
    
    Clipboard.setString(myReferralCode);
    showSuccessToast('Referral code copied to clipboard!');
  };

  if (checkingReferral) {
    return (
      <ImageBackground
        source={require('../../assets/images/miningScreen/bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.title}>🎁 REFERRAL PROGRAM</Text>
        <Text style={styles.subtitle}>
          {hasUsedReferral 
            ? 'Share your code and earn rewards!' 
            : 'Enter a referral code or share yours!'}
        </Text>

        {/* Your Referral Code Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR REFERRAL CODE</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText} numberOfLines={1}>
              {myReferralCode || 'Loading...'}
            </Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={handleCopyReferral}
            >
              <Text style={styles.actionButtonText}>📋 COPY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShareReferral}
            >
              <Text style={styles.actionButtonText}>📤 SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apply Referral Code Section */}
        {!hasUsedReferral && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ENTER REFERRAL CODE</Text>
            <Text style={styles.cardSubtitle}>
              Enter a friend's wallet address to give them 200 tokens!
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter 6-character code..."
              placeholderTextColor="#666"
              value={inputReferralCode}
              onChangeText={setInputReferralCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            
            <TouchableOpacity
              style={[styles.applyButton, loading && styles.buttonDisabled]}
              onPress={handleApplyReferral}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>✨ APPLY CODE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {hasUsedReferral && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ✅ You've already used a referral code!
            </Text>
            <Text style={styles.infoSubtext}>
              Share your code with friends to earn rewards when they sign up.
            </Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={[globalStyles.primaryButton, globalStyles.marginTop20]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={globalStyles.primaryButtonText}>← BACK TO HOME</Text>
        </TouchableOpacity>
      </View>

      {/* Banner Ad at Bottom */}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 3,
    borderColor: COLORS.buttonBorderColor,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 15,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 15,
  },
  codeContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.buttonBorderColor,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
    borderColor: COLORS.buttonBorderColor,
  },
  shareButton: {
    backgroundColor: COLORS.buttonBackgroundColor,
    borderWidth: 2,
    borderColor:COLORS.buttonBorderColor,

  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: COLORS.buttonBorderColor,
    marginBottom: 15,
  },
  applyButton: {
    backgroundColor: COLORS.buttonBackgroundColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#88FFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 3,
    borderColor: COLORS.buttonBorderColor,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default ReferralScreen;
