import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  const handleSignup = async () => {
    if (!wallet.trim()) {
      showErrorToast('Please enter your wallet address');
      return;
    }

    setLoading(true);
    try {
      await api.signup(wallet.trim());
      showSuccessToast('Welcome to Crypto Mining Village! 🎉', 'Account Created');
      navigation.replace('Home');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to signup';
      showErrorToast(errorMessage, 'Signup Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/signupPage/bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          {/* Signup Card Image as container */}
          <View style={styles.cardContainer}>
            <Image
              source={require('../../assets/images/signupPage/signup_card.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />

            {/* Overlay Content */}
            <View style={styles.cardContent}>
              <Text style={styles.title}>CRYPTO MINING VILLAGE</Text>
              <Text style={styles.subtitle}>Join the village and start mining! ⛏️</Text>

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
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 400,
    position: 'absolute',
  },
  cardContent: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: 'rgba(44, 255, 233, 1)',
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 163, 163, 1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(44, 255, 233, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignupScreen;
