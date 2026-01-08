import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';
import AchievementService from '@/services/achievement.service';
import Recipe from '@/models/Recipe';

async function generateUniqueCode(): Promise<string> {
  // 5-digit zero-padded numeric code
  const attempt = async () => {
    const code = (Math.floor(Math.random() * 90000) + 10000).toString(); // 10000-99999
    const exists = await Recipe.exists({ code });
    if (exists) return null;
    return code;
  };

  for (let i = 0; i < 10; i++) {
    const result = await attempt();
    if (result) return result;
  }
  throw new Error('Unable to generate unique code');
}

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[DEBUG] Missing or malformed authorization header:', authHeader);
    return { error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  console.log('[DEBUG] JWT payload:', payload);

  if (!payload) {
    console.log('[DEBUG] Invalid token:', token);
    return { error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    console.log('[DEBUG] Auth error:', auth.error);
    return auth.error;
  }

  try {
    await connectDB();
    console.log('[DEBUG] Connected to DB');

    const userId = auth.user!.userId;
    const { id: postId } = await params;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    console.log('[DEBUG] userId:', userId, 'postId:', postId);

    // Check if post exists
    const post = await SocialPost.findById(postId);
    if (!post) {
      console.log('[DEBUG] Post not found for postId:', postId);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    console.log('[DEBUG] Post found:', post);

    const savedUserIds = post.savedUserIds || [];
    console.log('[DEBUG] Current savedUserIds:', savedUserIds);

    const userSavedIndex = savedUserIds.findIndex((id: mongoose.Types.ObjectId) => id.toString() === userId);

    console.log('[DEBUG] userSavedIndex:', userSavedIndex);

    if (userSavedIndex !== -1) {
      // Unsave: remove the user ID from the array
      savedUserIds.splice(userSavedIndex, 1);
      console.log('[DEBUG] Removing userId from savedUserIds. New array:', savedUserIds);

      await SocialPost.updateOne(
        { _id: postId },
        { $set: { savedUserIds } }
      );

      console.log('[DEBUG] Updated SocialPost after unsave');

      // Delete the saved recipe copy if it exists
      if (post.recipeId) {
        try {
          const recipeIdObj = typeof post.recipeId === 'string' 
            ? new mongoose.Types.ObjectId(post.recipeId) 
            : post.recipeId;
          
          console.log('[DEBUG] Attempting to delete recipe with:');
          console.log('[DEBUG]   userId:', userId, '(ObjectId:', userIdObj.toString(), ')');
          console.log('[DEBUG]   originalRecipeId:', post.recipeId, '(ObjectId:', recipeIdObj.toString(), ')');
          
          // First, check if the recipe exists
          const existingSavedRecipe = await Recipe.findOne({
            userId: userIdObj,
            originalRecipeId: recipeIdObj,
          });
          
          console.log('[DEBUG] Found existing saved recipe to delete:', existingSavedRecipe ? existingSavedRecipe._id : 'NONE');
          
          if (existingSavedRecipe) {
            const deletedRecipe = await Recipe.deleteOne({
              userId: userIdObj,
              originalRecipeId: recipeIdObj,
            });
            console.log('[DEBUG] Deleted saved recipe copy. Deleted count:', deletedRecipe.deletedCount);
            
            if (deletedRecipe.deletedCount === 0) {
              console.log('[DEBUG] WARNING: Recipe found but deletion returned 0. Trying alternative query...');
              // Try alternative: delete by _id directly
              await Recipe.findByIdAndDelete(existingSavedRecipe._id);
              console.log('[DEBUG] Deleted recipe directly by _id');
            }
          } else {
            console.log('[DEBUG] No saved recipe found to delete. Searching all user recipes...');
            const allUserRecipes = await Recipe.find({ userId: userIdObj, owning: false }).select('_id title originalRecipeId');
            console.log('[DEBUG] All saved recipes for user:', allUserRecipes.map(r => ({
              id: r._id,
              title: r.title,
              originalRecipeId: r.originalRecipeId,
            })));
          }
        } catch (error) {
          console.error('[DEBUG] Error deleting saved recipe:', error);
          // Continue even if deletion fails
        }
      } else {
        console.log('[DEBUG] Post has no recipeId, skipping recipe deletion');
      }

      return NextResponse.json({
        saved: false,
        saves: savedUserIds.length,
      });
    } else {
      // Save: add the user ID to the array
      savedUserIds.push(userIdObj);
      console.log('[DEBUG] Adding userId to savedUserIds. New array:', savedUserIds);

      await SocialPost.updateOne(
        { _id: postId },
        { $set: { savedUserIds } }
      );
      console.log('[DEBUG] Updated SocialPost after save');

      // Create a recipe copy for the user if the post has a recipe
      if (post.recipeId) {
        const recipeIdObj = typeof post.recipeId === 'string' 
          ? new mongoose.Types.ObjectId(post.recipeId) 
          : post.recipeId;
        
        const originalRecipe = await Recipe.findById(recipeIdObj);
        console.log('[DEBUG] Fetched original Recipe:', originalRecipe?._id);

        if (originalRecipe) {
          // Check if user already has a saved copy of this recipe
          const existingSavedRecipe = await Recipe.findOne({
            userId: userIdObj,
            originalRecipeId: recipeIdObj,
          });

          if (!existingSavedRecipe) {
            // Create a new recipe copy for the user
            const recipeData = originalRecipe.toObject();
            const newCode = await generateUniqueCode();
            
            console.log('[DEBUG] Creating recipe copy with originalRecipeId:', recipeIdObj.toString());
            
            const createdRecipe = await Recipe.create({
              userId: userIdObj,
              title: recipeData.title,
              description: recipeData.description,
              owning: false, // Saved recipe, not owned
              code: newCode,
              time: recipeData.time,
              kcal: recipeData.kcal,
              picture: recipeData.picture,
              type: recipeData.type,
              image: recipeData.image || '',
              ingredients: recipeData.ingredients || [],
              steps: recipeData.steps || [],
              links: recipeData.links || [],
              originalRecipeId: recipeIdObj, // Reference to original recipe - MUST be saved
            });
            
            // Verify the originalRecipeId was saved
            const verifyRecipe = await Recipe.findById(createdRecipe._id);
            console.log('[DEBUG] Created saved recipe copy for user:', userId);
            console.log('[DEBUG] Created recipe ID:', createdRecipe._id);
            console.log('[DEBUG] Original Recipe ID saved:', verifyRecipe?.originalRecipeId?.toString() || 'NOT SAVED!');
            console.log('[DEBUG] Recipe owning status:', verifyRecipe?.owning);
            
            if (!verifyRecipe?.originalRecipeId) {
              console.error('[DEBUG] ERROR: originalRecipeId was not saved! Attempting to update...');
              await Recipe.findByIdAndUpdate(createdRecipe._id, {
                originalRecipeId: recipeIdObj,
              });
              console.log('[DEBUG] Updated originalRecipeId after creation');
            }
          } else {
            console.log('[DEBUG] User already has a saved copy of this recipe:', existingSavedRecipe._id);
            console.log('[DEBUG] Existing recipe originalRecipeId:', existingSavedRecipe.originalRecipeId?.toString());
          }
        }
      }

      // Track achievement (async, don't wait for it)
      AchievementService.trackAndCheck(userId!, 'recipes_saved').catch(err =>
        console.error('Achievement tracking error:', err)
      );

      return NextResponse.json({
        saved: true,
        saves: savedUserIds.length,
      });
    }

  } catch (error: any) {
    console.error('Toggle save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
