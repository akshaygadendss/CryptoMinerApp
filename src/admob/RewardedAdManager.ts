// src/admob/RewardedAdManager.ts
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3644060799052014/6284342949'; // Replace with your real ad unit ID

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['gaming', 'rewards'],
});

export const loadRewardedAd = (onRewardEarned: (reward: any) => void) => {
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log('Rewarded ad loaded');
  });

  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
    console.log('User earned reward:', reward);
    onRewardEarned?.(reward);
  });

  rewarded.load();
};

export const showRewardedAd = () => {
  if (rewarded.loaded) {
    rewarded.show();
  } else {
    console.log('Ad not loaded yet');
  }
};