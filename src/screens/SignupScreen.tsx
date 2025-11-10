import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/mining';
import api from '../services/api';
import { AnimatedBackground } from "../components/AnimatedBackground";

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);

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
    <ImageBackground
      source={require('../../assets/logo.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
      imageStyle={styles.imageStyle}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
           <AnimatedBackground />
          <View style={styles.content}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            <Text style={styles.title}>CRYPTO MINING VILLAGE</Text>
            {/* <Text style={styles.subtitle}>Start Your Mining Journey</Text> */}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Wallet Address"
                placeholderTextColor={COLORS.textLight}
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
                {loading ? 'Connecting...' : 'Start Mining'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageStyle: {
    opacity: 0.5,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignupScreen;