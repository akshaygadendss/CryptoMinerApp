# Config Migration to MongoDB

## Overview
Migrated hardcoded constants (MINING_RATES, DURATION_OPTIONS, COLORS) from frontend to MongoDB for centralized configuration management.

## Changes Made

### Backend

1. **New Model**: `backend/models/Config.js`
   - Stores configuration key-value pairs
   - Supports MINING_RATES, DURATION_OPTIONS, and COLORS

2. **Seed Script**: `backend/seedConfig.js`
   - One-time script to populate MongoDB with config data
   - Run with: `npm run seed`

3. **API Endpoints**: Added to `backend/routes/userRoutes.js`
   - `GET /api/config/:key` - Get specific config by key
   - `GET /api/config` - Get all configs

### Frontend

1. **Updated Constants**: `src/constants/mining.ts`
   - Added async functions: `getMiningRates()`, `getDurationOptions()`
   - Includes fallback values if API fails
   - Implements caching to avoid repeated API calls

2. **New Hook**: `src/hooks/useConfig.ts`
   - React hook to load config on component mount
   - Returns `{ miningRates, durationOptions, loading }`

3. **Updated Screens**:
   - `HomeScreen.tsx` - Uses `useConfig()` hook
   - `MiningScreen.tsx` - Uses `useConfig()` hook

## Usage

### First Time Setup
```bash
cd backend
npm run seed
```

### Frontend Usage
```typescript
import { useConfig } from '../hooks/useConfig';

const MyComponent = () => {
  const { miningRates, durationOptions, loading } = useConfig();
  
  if (loading || !miningRates) {
    return <Loading />;
  }
  
  // Use miningRates and durationOptions
};
```

### Updating Config Values
To update config values in MongoDB, you can either:
1. Modify `seedConfig.js` and run `npm run seed` again
2. Update directly in MongoDB
3. Create an admin API endpoint (future enhancement)

## Benefits
- ✅ Centralized configuration management
- ✅ No need to rebuild app to change rates/durations
- ✅ Consistent data across all clients
- ✅ Easy to update via database
- ✅ Fallback values ensure app works even if API fails
