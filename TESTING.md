# Testing the Config Migration

## Backend Testing

### 1. Verify Config Data in MongoDB
The seed script has already populated the database. You can verify by:

**Option A: Using MongoDB Compass or CLI**
```bash
# Connect to your MongoDB instance
mongo <your-connection-string>

# Switch to your database
use cryptominer

# View all configs
db.config.find().pretty()
```

**Option B: Using the API**
```bash
# Get all configs
curl http://localhost:3000/api/config

# Get specific config
curl http://localhost:3000/api/config/MINING_RATES
curl http://localhost:3000/api/config/DURATION_OPTIONS
curl http://localhost:3000/api/config/COLORS
```

### 2. Expected Response Format

**GET /api/config**
```json
{
  "configs": {
    "MINING_RATES": {
      "1": { "rate": 0.01, "hourlyReward": 36 },
      "2": { "rate": 0.02, "hourlyReward": 72 },
      ...
    },
    "DURATION_OPTIONS": [
      { "value": 1, "label": "1 Hour" },
      ...
    ],
    "COLORS": {
      "primary": "#6366F1",
      ...
    }
  }
}
```

**GET /api/config/MINING_RATES**
```json
{
  "key": "MINING_RATES",
  "value": {
    "1": { "rate": 0.01, "hourlyReward": 36 },
    "2": { "rate": 0.02, "hourlyReward": 72 },
    ...
  },
  "updatedAt": "2024-11-11T..."
}
```

## Frontend Testing

### 1. Test Config Loading
The app should:
1. Load config from API on app start
2. Cache the config to avoid repeated API calls
3. Fall back to hardcoded values if API fails

### 2. Test Screens
- **HomeScreen**: Should display duration options from MongoDB
- **MiningScreen**: Should show mining rates from MongoDB
- Both screens should show loading state while config loads

### 3. Test Offline Behavior
1. Turn off backend server
2. Restart the app
3. App should use fallback values and continue working

## Updating Config Values

### Method 1: Re-run Seed Script
```bash
cd backend
# Edit seedConfig.js with new values
npm run seed
```

### Method 2: Direct MongoDB Update
```javascript
// In MongoDB shell or Compass
db.config.updateOne(
  { key: "MINING_RATES" },
  { 
    $set: { 
      "value.1.hourlyReward": 40,  // Change from 36 to 40
      updatedAt: new Date()
    }
  }
)
```

### Method 3: Using API (Future Enhancement)
Create an admin endpoint:
```javascript
// PUT /api/config/:key
router.put('/config/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  const config = await Config.findOneAndUpdate(
    { key: key.toUpperCase() },
    { value, updatedAt: new Date() },
    { new: true }
  );
  
  res.json({ config });
});
```

## Troubleshooting

### Config not loading in app
1. Check backend is running
2. Check API_URL in `src/services/api.ts` matches your backend
3. Check network connectivity
4. Look for errors in console logs

### Fallback values being used
- This is expected if backend is unreachable
- Check backend logs for errors
- Verify MongoDB connection

### Config changes not reflecting
1. Clear app cache/data
2. Restart the app
3. Check if config was actually updated in MongoDB
