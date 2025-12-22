/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';
import { name as appName } from './app.json';


// IMPORTANT: Background notification handler
// This MUST be at the top level, outside of any component
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifee] Background Event:', type);

  if (type === EventType.PRESS) {
    console.log('[Notifee] User pressed notification in background');
    // You can perform any necessary cleanup or data updates here
  }

  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'claim') {
    console.log('[Notifee] User pressed claim action');
  }

  if (type === EventType.DISMISSED) {
    console.log('[Notifee] User dismissed notification');
  }
});

AppRegistry.registerComponent(appName, () => App);
