// Quick MongoDB fix script
// Run this in MongoDB Compass or Shell to add progress field to your user

// Replace YOUR_USER_EMAIL with your actual email
db.users.updateOne(
  { email: "tamas+361@blcks.hu" },  // or whatever email you're using
  {
    $set: {
      progress: {
        recipes_created: 2,  // Set to current count
        recipes_saved: 0,
        photos_analyzed: 0,
        recipes_imported: 0,
        ai_recipes_generated: 0,
        posts_created: 0,
        likes_given: 0,
        comments_created: 0,
        followers_count: 0,
        household_actions: 0
      }
    }
  }
)

// OR to update ALL users at once:
db.users.updateMany(
  {},
  {
    $set: {
      progress: {
        recipes_created: 0,
        recipes_saved: 0,
        photos_analyzed: 0,
        recipes_imported: 0,
        ai_recipes_generated: 0,
        posts_created: 0,
        likes_given: 0,
        comments_created: 0,
        followers_count: 0,
        household_actions: 0
      }
    }
  }
)

// After running this, restart your backend and the tracking will work!

