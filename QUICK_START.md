# Quick Start - Config Migration

## ✅ What's Done
- Config values moved to MongoDB
- Seed script executed successfully
- Frontend updated to fetch from API
- All functionality preserved

## 🚀 Running Your App

### Backend
```bash
cd backend
npm start
# or
npm run dev
```

### Frontend
```bash
cd ..
npm start
# or
npx react-native run-android
# or
npx react-native run-ios
```

## 📝 How to Update Config Values

### Option 1: Edit and Re-seed (Recommended for bulk changes)
```bash
cd backend
# 1. Edit seedConfig.js with new values
# 2. Run seed script
npm run seed
```

### Option 2: Direct MongoDB Update (For single value changes)
```javascript
// In MongoDB Compass or shell
db.config.updateOne(
  { key: "MINING_RATES" },
  { $set: { "value.1.hourlyReward": 40 } }
)
```

### Option 3: Using API (Test with curl)
```bash
# View current config
curl http://localhost:3000/api/config/MINING_RATES

# To update, you'd need to create a PUT endpoint (future enhancement)
```

## 🔍 Verify Everything Works

1. **Check MongoDB has data:**
   ```bash
   cd backend
   npm run seed  # Should show "✅ All config data seeded successfully!"
   ```

2. **Test API endpoints:**
   ```bash
   curl http://localhost:3000/api/config
   curl http://localhost:3000/api/config/MINING_RATES
   ```

3. **Run the app:**
   - App should load normally
   - Mining rates and duration options should work
   - Check console logs for "[API] GetConfig" messages

## 🎯 Key Points

- **Config is cached** - Loaded once per app session
- **Offline support** - Falls back to hardcoded values if API fails
- **No breaking changes** - All existing functionality works
- **Type-safe** - Full TypeScript support maintained

## 📚 More Info

- **CONFIG_MIGRATION.md** - Technical details
- **TESTING.md** - Testing guide
- **CHANGES_SUMMARY.md** - Complete list of changes
