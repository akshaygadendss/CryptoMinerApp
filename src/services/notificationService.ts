import notifee, { 
  AndroidImportance, 
  TriggerType, 
  TimestampTrigger,
  EventType
} from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  private channelId = 'mining-timer-channel';
  
  /**
   * Initialize notification channel (Android only)
   */
  async initialize() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: this.channelId,
        name: 'Mining Timer',
        description: 'Notifications for mining completion',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
      });
    }

    // Request permissions for iOS
    if (Platform.OS === 'ios') {
      await notifee.requestPermission();
    }
  }

  /**
   * Request notification permissions (iOS 13+ and Android 13+)
   */
  async requestPermissions() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = authorized
  }

  /**
   * Schedule a notification for when mining completes
   * @param timeRemaining - seconds until mining completes
   * @param tokensEarned - total tokens that will be earned
   */
  async scheduleMiningCompleteNotification(
    timeRemaining: number,
    tokensEarned: number
  ) {
    try {
      // Cancel any existing mining notifications
      await this.cancelMiningNotifications();

      // Calculate trigger time
      const triggerTime = Date.now() + timeRemaining * 1000;
      const triggerDate = new Date(triggerTime);
      
      console.log('[Notifee] Scheduling notification:', {
        timeRemaining,
        tokensEarned,
        triggerTime,
        triggerDate: triggerDate.toLocaleString(),
        now: new Date().toLocaleString()
      });

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
        alarmManager: {
          allowWhileIdle: true, // Important for background delivery
        },
      };

      const notificationId = await notifee.createTriggerNotification(
        {
          id: 'mining-complete',
          title: '⛏️ Mining Complete!',
          body: `You've mined ${tokensEarned.toFixed(4)} tokens. Tap to claim your rewards!`,
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            sound: 'default',
            vibrationPattern: [300, 500, 300, 500],
            smallIcon: 'ic_notification', // Make sure to add this icon
            color: '#00FFFF',
            actions: [
              {
                title: '🎁 Claim Now',
                pressAction: {
                  id: 'claim',
                  launchActivity: 'default',
                },
              },
            ],
          },
          ios: {
            sound: 'default',
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
            },
            categoryId: 'mining-actions',
          },
        },
        trigger
      );

      console.log('[Notifee] ✅ Notification scheduled successfully!', {
        notificationId,
        willFireAt: triggerDate.toLocaleString()
      });
      return notificationId;
    } catch (error) {
      console.error('[Notifee] Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Display an immediate notification (for testing or immediate alerts)
   */
  async displayImmediateNotification(title: string, body: string) {
    try {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('[Notifee] Error displaying notification:', error);
    }
  }

  /**
   * Cancel all mining-related notifications
   */
  async cancelMiningNotifications() {
    try {
      await notifee.cancelNotification('mining-complete');
      await notifee.cancelTriggerNotification('mining-complete');
      console.log('[Notifee] Cancelled mining notifications');
    } catch (error) {
      console.error('[Notifee] Error cancelling notifications:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('[Notifee] Cancelled all notifications');
    } catch (error) {
      console.error('[Notifee] Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const notifications = await notifee.getTriggerNotifications();
      return notifications;
    } catch (error) {
      console.error('[Notifee] Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Handle notification interactions
   */
  async setupNotificationHandlers(navigation: any) {
    // Foreground event handler
    const unsubscribeForeground = notifee.onForegroundEvent(
      async ({ type, detail }) => {
        console.log('[Notifee] Foreground event:', type, detail);

        if (type === EventType.PRESS) {
          // Navigate to claim screen
          navigation.navigate('Claim');
        }

        if (
          type === EventType.ACTION_PRESS &&
          detail.pressAction?.id === 'claim'
        ) {
          // Navigate to claim screen
          navigation.navigate('Claim');
        }
      }
    );

    // Background event handler (must be outside component)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('[Notifee] Background event:', type, detail);

      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        // The app will open and navigation will be handled by the foreground handler
        console.log('[Notifee] App opened from notification');
      }
    });

    return unsubscribeForeground;
  }

  /**
   * Update scheduled notification (reschedule if time changed)
   */
  async updateMiningNotification(timeRemaining: number, tokensEarned: number) {
    await this.scheduleMiningCompleteNotification(timeRemaining, tokensEarned);
  }
}

export default new NotificationService();