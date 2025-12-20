/**
 * Migration script to add streak and lastActiveDate fields to existing users
 * Run this once to update all existing users in the database
 */

import mongoose from 'mongoose';
import User from '../models/User';

async function migrateUsers() {
  try {
    // Connect to MongoDB - use the same connection string from your backend
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';
    
    if (!MONGODB_URI || MONGODB_URI === 'mongodb+srv://your-connection-string') {
      console.log('\n⚠️  Please set MONGODB_URI environment variable or update the script with your connection string\n');
      console.log('Usage: MONGODB_URI="your-connection-string" npx tsx scripts/migrate-add-streak.ts\n');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without streak field
    const users = await User.find({
      $or: [
        { streak: { $exists: false } },
        { lastActiveDate: { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users to update`);

    if (users.length === 0) {
      console.log('All users already have streak fields. No migration needed.');
      await mongoose.connection.close();
      return;
    }

    // Update each user
    let updated = 0;
    for (const user of users) {
      if (user.streak === undefined) {
        user.streak = 0;
      }
      if (user.lastActiveDate === undefined) {
        user.lastActiveDate = null;
      }
      await user.save();
      updated++;
      console.log(`Updated user: ${user.username} (${updated}/${users.length})`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} users.`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();

