/**
 * Script to fix user documents that have households but missing householdId field
 * Run with: npx tsx scripts/fix-household-user.ts
 */

import mongoose from 'mongoose';
import User from '../models/User';
import Household from '../models/Household';

async function fixHouseholdUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/save-recipe';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all households
    const households = await Household.find({});
    console.log(`Found ${households.length} households`);

    let fixed = 0;
    let alreadyFixed = 0;

    for (const household of households) {
      // Find users in this household
      const memberIds = household.members.map((m: any) => m.toString());
      
      for (const memberId of memberIds) {
        const user = await User.findById(memberId);
        
        if (user) {
          // Check if user.householdId is missing or doesn't match
          const userHouseholdId = user.householdId?.toString();
          const correctHouseholdId = household._id.toString();
          
          if (!userHouseholdId || userHouseholdId !== correctHouseholdId) {
            await User.updateOne(
              { _id: memberId },
              { $set: { householdId: household._id } }
            );
            console.log(`✅ Fixed user ${memberId} -> household ${household.name} (${household._id})`);
            fixed++;
          } else {
            alreadyFixed++;
          }
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} users`);
    console.log(`✓ ${alreadyFixed} users were already correct`);
    
    // Also find users with householdId but not in any household members
    const usersWithHousehold = await User.find({ householdId: { $ne: null } });
    for (const user of usersWithHousehold) {
      const household = await Household.findById(user.householdId);
      if (household && !household.members.includes(user._id)) {
        console.log(`⚠️  User ${user._id} has householdId but not in household members`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixHouseholdUsers();

