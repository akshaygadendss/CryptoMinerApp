import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.39:3000/api';
//const API_URL = 'http://10.97.121.196:3000/api';

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

export interface UserSummary {
  wallet: string;
  totalEarnedSum: number;
  latestSession: User | null;
}

export const isMiningComplete = (user: User | null): boolean => {
  if (!user || user.status !== 'mining') return false;
  const startTime = new Date(user.miningStartTime || '');
  const now = new Date();
  const totalElapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const totalSeconds = user.selectedHour * 3600;
  return totalElapsedSeconds >= totalSeconds;
};

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

  async getUserSummary(wallet: string): Promise<UserSummary> {
    try {
      console.log('[API] GetUserSummary request:', { wallet, url: `${API_URL}/user-summary/${wallet}` });
      const response = await axios.get(`${API_URL}/user-summary/${wallet}`);
      console.log('[API] GetUserSummary response:', response.data);
      return response.data as UserSummary;
    } catch (error: any) {
      console.error('[API] GetUserSummary error:', {
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

  async getConfig(key?: string): Promise<any> {
    try {
      const url = key ? `${API_URL}/config/${key}` : `${API_URL}/config`;
      console.log('[API] GetConfig request:', { key, url });
      const response = await axios.get(url);
      console.log('[API] GetConfig response:', response.data);
      return key ? response.data.value : response.data.configs;
    } catch (error: any) {
      console.error('[API] GetConfig error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async getLeaderboard(): Promise<any[]> {
    try {
      console.log('[API] GetLeaderboard request:', { url: `${API_URL}/leaderboard` });
      const response = await axios.get(`${API_URL}/leaderboard`);
      console.log('[API] GetLeaderboard response:', response.data);
      return response.data.leaderboard || [];
    } catch (error: any) {
      console.error('[API] GetLeaderboard error:', {
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
