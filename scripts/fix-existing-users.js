/**
 * Simple MongoDB script to add missing fields to existing users
 * Run this in MongoDB Shell or MongoDB Compass
 */

// Copy and paste this into MongoDB Compass "Aggregations" or Shell:

db.users.updateMany(
  {
    $or: [
      { streak: { $exists: false } },
      { lastActiveDate: { $exists: false } },
      { followers: { $exists: false } },
      { following: { $exists: false } },
      { householdId: { $exists: false } },
      { recipeBackgrounds: { $exists: false } }
    ]
  },
  {
    $set: {
      streak: 0,
      lastActiveDate: null
    },
    $setOnInsert: {
      followers: 0,
      following: 0,
      householdId: null,
      recipeBackgrounds: {
        breakfast: "#FFF3D9",
        lunch: "#DDF6FF",
        dinner: "#FFE5F3",
        snack: "#F6F4F0",
        drink: "#E8F6F5"
      }
    }
  }
)

// This will:
// 1. Find all users missing any of these fields
// 2. Add streak: 0 and lastActiveDate: null to all matching users
// 3. Add other fields only if they don't exist (using $setOnInsert logic)
// 4. Return: { acknowledged: true, matchedCount: X, modifiedCount: X }

