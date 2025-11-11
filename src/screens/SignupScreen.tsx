import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api from '../services/api';

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const walletIconAnim = new Animated.Value(0);

  React.useEffect(() => {
    // If a wallet is already stored, go straight to Home
    (async () => {
      try {
        const stored = await api.getStoredWallet();
        if (stored) {
          navigation.replace('Home');
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    // Animate wallet icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(walletIconAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();
  }, []);

  const walletIconRotation = walletIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const walletIconTranslateY = walletIconAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0],
  });

  const handleSignup = async () => {
    if (!wallet.trim()) {
      Alert.alert('Error', 'Please enter your wallet address');
      return;
    }

    setLoading(true);
    try {
      console.log('[SignupScreen] Starting signup for wallet:', wallet.trim());
      await api.signup(wallet.trim());
      console.log('[SignupScreen] Signup successful, navigating to Home');
      navigation.replace('Home');
    } catch (error: any) {
      console.error('[SignupScreen] Signup failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to signup';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.navyLight, COLORS.darkCard]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header Image */}
          <View style={styles.headerImageContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>

          {/* Signup Card */}
          <View style={styles.card}>
            {/* Wallet Icon */}
            <Animated.View
              style={[
                styles.walletIconContainer,
                {
                  transform: [
                    { rotate: walletIconRotation },
                    { translateY: walletIconTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.walletIcon}>
                <Text style={styles.walletIconText}>💼</Text>
              </View>
            </Animated.View>

            <Text style={styles.title}>CRYPTO MINING VILLAGE</Text>
            <Text style={styles.subtitle}>Join the village and start mining! ⛏️</Text>

            {/* Wallet Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>WALLET ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your wallet..."
                placeholderTextColor={COLORS.slate}
                value={wallet}
                onChangeText={setWallet}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Connecting...' : 'START MINING 🚀'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  headerImageContainer: {
    width: '100%',
    maxWidth: 800,
    marginBottom: 32,
  },
  headerImage: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: COLORS.cyan,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 32,
    borderWidth: 4,
    borderColor: COLORS.cyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  walletIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.orange,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  walletIconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 4,
    borderColor: COLORS.cyan,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignupScreen;
