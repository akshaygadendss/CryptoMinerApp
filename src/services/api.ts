import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.39:3000/api';

export interface User {
  _id: string;
  wallet: string;
  createdDate: string;
  multiplier: number;
  status: 'idle' | 'mining' | 'ready_to_claim' | 'claimed';
  miningStartTime: string | null;
  currentMultiplierStartTime: string | null;
  totalEarned: number;
  currentMiningPoints: number;
  lastUpdated: string;
  selectedHour: number;
}

export interface MiningProgress {
  currentPoints: number;
  timeElapsed: number;
  timeRemaining: number;
  progress: number;
  isComplete: boolean;
}

class API {
  async signup(wallet: string): Promise<User> {
    try {
      console.log('[API] Signup request:', { wallet, url: `${API_URL}/signup` });
      const response = await axios.post(`${API_URL}/signup`, { wallet });
      console.log('[API] Signup response:', response.data);
      const user = response.data.user;
      await AsyncStorage.setItem('wallet', wallet);
      return user;
    } catch (error: any) {
      console.error('[API] Signup error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async getUser(wallet: string): Promise<User> {
    try {
      console.log('[API] GetUser request:', { wallet, url: `${API_URL}/user/${wallet}` });
      const response = await axios.get(`${API_URL}/user/${wallet}`);
      console.log('[API] GetUser response:', response.data);
      return response.data.user;
    } catch (error: any) {
      console.error('[API] GetUser error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async startMining(wallet: string, selectedHour: number, multiplier: number): Promise<User> {
    try {
      console.log('[API] StartMining request:', { 
        wallet, 
        selectedHour, 
        multiplier,
        url: `${API_URL}/start-mining` 
      });
      const response = await axios.post(`${API_URL}/start-mining`, {
        wallet,
        selectedHour,
        multiplier
      });
      console.log('[API] StartMining response:', response.data);
      return response.data.user;
    } catch (error: any) {
      console.error('[API] StartMining error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async calculateProgress(wallet: string): Promise<MiningProgress> {
    try {
      console.log('[API] CalculateProgress request:', { wallet, url: `${API_URL}/calculate-progress` });
      const response = await axios.post(`${API_URL}/calculate-progress`, { wallet });
      console.log('[API] CalculateProgress response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] CalculateProgress error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async claimReward(wallet: string): Promise<User> {
    try {
      console.log('[API] ClaimReward request:', { wallet, url: `${API_URL}/claim-reward` });
      const response = await axios.post(`${API_URL}/claim-reward`, { wallet });
      console.log('[API] ClaimReward response:', response.data);
      return response.data.user;
    } catch (error: any) {
      console.error('[API] ClaimReward error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async getStoredWallet(): Promise<string | null> {
    try {
      const wallet = await AsyncStorage.getItem('wallet');
      console.log('[API] GetStoredWallet:', wallet);
      return wallet;
    } catch (error: any) {
      console.error('[API] GetStoredWallet error:', error.message);
      throw error;
    }
  }

  async upgradeMultiplier(wallet: string, newMultiplier: number): Promise<User> {
    try {
      console.log('[API] UpgradeMultiplier request:', { 
        wallet, 
        newMultiplier,
        url: `${API_URL}/upgrade-multiplier` 
      });
      const response = await axios.post(`${API_URL}/upgrade-multiplier`, {
        wallet,
        newMultiplier
      });
      console.log('[API] UpgradeMultiplier response:', response.data);
      return response.data.user;
    } catch (error: any) {
      console.error('[API] UpgradeMultiplier error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }
}

export default new API();
