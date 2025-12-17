import mongoose from 'mongoose';

// Load environment variables from .env file
const MONGODB_URI = process.env.MONGODB_URI;

async function fixLikeIndexes() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const collection = db?.collection('likes');

    if (!collection) {
      throw new Error('likes collection not found');
    }

    console.log('Dropping old indexes...');
    
    // Drop old indexes if they exist
    try {
      await collection.dropIndex('postId_1_userId_1');
      console.log('Dropped index: postId_1_userId_1');
    } catch (e: any) {
      if (e.code !== 27) { // 27 is "IndexNotFound"
        console.log('Index postId_1_userId_1 not found or already dropped');
      }
    }

    try {
      await collection.dropIndex('commentId_1_userId_1');
      console.log('Dropped index: commentId_1_userId_1');
    } catch (e: any) {
      if (e.code !== 27) { // 27 is "IndexNotFound"
        console.log('Index commentId_1_userId_1 not found or already dropped');
      }
    }

    console.log('Creating new partial indexes...');
    
    // Create new partial indexes
    await collection.createIndex(
      { postId: 1, userId: 1 },
      { 
        unique: true, 
        partialFilterExpression: { postId: { $exists: true, $ne: null } },
        name: 'postId_1_userId_1'
      }
    );
    console.log('Created index: postId_1_userId_1 (partial)');

    await collection.createIndex(
      { commentId: 1, userId: 1 },
      { 
        unique: true, 
        partialFilterExpression: { commentId: { $exists: true, $ne: null } },
        name: 'commentId_1_userId_1'
      }
    );
    console.log('Created index: commentId_1_userId_1 (partial)');

    console.log('✅ Index migration completed successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixLikeIndexes();
