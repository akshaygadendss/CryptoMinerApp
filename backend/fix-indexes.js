import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    // Our session documents are stored in the 'minerdata' collection
    const collection = db.collection('minerdata');

    console.log('Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop unique index on wallet if it exists (name typically 'wallet_1')
    try {
      await collection.dropIndex('wallet_1');
      console.log('✅ Dropped wallet_1 index');
    } catch (error) {
      console.log('ℹ️  wallet_1 index does not exist or already dropped');
    }

    // Ensure a non-unique index on wallet for efficient lookups
    await collection.createIndex({ wallet: 1 }, { unique: false, name: 'wallet_1' });
    console.log('✅ Ensured non-unique index on wallet');

    console.log('Final indexes:');
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes);

    console.log('✅ Index fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();
