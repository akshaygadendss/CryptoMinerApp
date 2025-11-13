# Notification Debugging Guide

## Testing Buttons Added to MiningScreen

1. **🔔 TEST NOW** - Sends an immediate notification to verify notifications work
2. **📋 CHECK** - Shows how many notifications are scheduled and when they'll fire
3. **⏰ SCHEDULE 10s TEST** - Schedules a test notification for 10 seconds from now

## Common Issues & Solutions

### 1. No Notifications Appearing

**Check Permissions:**
- Android 13+: Go to Settings > Apps > CryptoMinerApp > Notifications > Enable
- Make sure "Allow notifications" is ON

**Check Battery Optimization:**
- Settings > Apps > CryptoMinerApp > Battery > Unrestricted
- Some manufacturers (Samsung, Xiaomi, Huawei) have aggressive battery savers

**Check Do Not Disturb:**
- Make sure DND is off or app is allowed during DND

### 2. Testing Steps

1. **Test Immediate Notification:**
   - Tap "🔔 TEST NOW" button
   - You should see a notification immediately
   - If this doesn't work, permissions are the issue

2. **Test Scheduled Notification:**
   - Tap "⏰ SCHEDULE 10s TEST" button
   - Put app in background or lock screen
   - Wait 10 seconds
   - You should see "⛏️ Mining Complete!" notification

3. **Check Scheduled Notifications:**
   - Tap "📋 CHECK" button
   - Should show "1 scheduled" with time
   - If shows "0 scheduled", scheduling failed

### 3. Check Logs

Look for these log messages in Metro/Logcat:

```
[Notifications] 🚀 Initializing notification service...
[Notifications] ✅ Service initialized
[Notifications] 🔐 Permission status: true
[Notifications] 📡 Handlers set up
[Notifications] 🔔 Attempting to schedule notification...
[Notifee] Scheduling notification: {...}
[Notifee] ✅ Notification scheduled successfully!
```

### 4. Android-Specific Issues

**Exact Alarm Permission (Android 12+):**
- Some devices require explicit permission for exact alarms
- Settings > Apps > Special app access > Alarms & reminders > Enable for CryptoMinerApp

**Manufacturer-Specific:**
- **Samsung**: Settings > Apps > CryptoMinerApp > Battery > Unrestricted
- **Xiaomi**: Settings > Battery & performance > Manage apps battery usage > CryptoMinerApp > No restrictions
- **Huawei**: Settings > Battery > App launch > CryptoMinerApp > Manage manually > Enable all

### 5. Verify AndroidManifest.xml

Ensure these permissions exist:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 6. Rebuild App

If you just added notification code:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Expected Behavior

1. Start mining with 1 hour selected (30 seconds in test mode)
2. Notification scheduled for 30 seconds
3. Put app in background
4. After 30 seconds, notification appears
5. Tap notification → app opens to ClaimScreen

## Debug Output

When mining starts, you should see:
```
[Notifications] 🔔 Attempting to schedule notification...
[Notifications] 📋 Currently scheduled notifications: 0
[Notifications] 📊 Scheduling with: {
  rate: 0.01,
  finalTokens: 0.3,
  timeRemaining: 30,
  willFireAt: "11/13/2025, 3:45:30 PM"
}
[Notifee] ✅ Notification scheduled successfully!
```
