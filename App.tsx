import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import notifee, { EventType } from '@notifee/react-native';
import SplashScreen from './src/screens/SplashScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MiningScreen from './src/screens/MiningScreen';
import ClaimScreen from './src/screens/ClaimScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
 
const Stack = createNativeStackNavigator();
 
function App(): React.JSX.Element {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Check if app was opened by a notification
    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log('[App] Opened from notification:', initialNotification);
        // Wait for navigation to be ready, then navigate to Claim
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Claim');
          }
        }, 2000); // Give splash screen time to finish
      }
    };

    checkInitialNotification();

    // Handle notification press while app is in foreground
    const unsubscribe = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) {
        console.log('[App] Notification pressed in foreground');
        if (navigationRef.current) {
          navigationRef.current.navigate('Claim');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Mining" component={MiningScreen} />
          <Stack.Screen name="Claim" component={ClaimScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}
 
export default App;
 
 