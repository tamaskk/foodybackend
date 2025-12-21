/**
 * Achievement Engine Service
 * Handles achievement checking, unlocking, and notifications
 */

import User from '@/models/User';
import UserAchievement from '@/models/UserAchievement';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementsByAction,
  getAchievementById,
  TIER_DESCRIPTIONS
} from '@/lib/achievement-definitions';
import { calculateLevelFromXp } from '@/lib/level-system';

export class AchievementService {
  /**
   * Increment user progress counter
   * @param userId User ID
   * @param actionKey Progress key to increment
   * @param amount Amount to increment by (default 1)
   */
  static async incrementProgress(
    userId: string | mongoose.Types.ObjectId,
    actionKey: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const updateKey = `progress.${actionKey}`;
      await User.findByIdAndUpdate(
        userId,
        { $inc: { [updateKey]: amount } },
        { new: true }
      );
    } catch (error) {
      console.error('Error incrementing progress:', error);
    }
  }

  /**
   * Set user progress counter (for direct updates like follower count)
   * @param userId User ID
   * @param actionKey Progress key to set
   * @param value New value
   */
  static async setProgress(
    userId: string | mongoose.Types.ObjectId,
    actionKey: string,
    value: number
  ): Promise<void> {
    try {
      const updateKey = `progress.${actionKey}`;
      await User.findByIdAndUpdate(
        userId,
        { $set: { [updateKey]: value } },
        { new: true }
      );
    } catch (error) {
      console.error('Error setting progress:', error);
    }
  }

  /**
   * Check achievements for a specific action and unlock if thresholds are met
   * @param userId User ID
   * @param actionKey The action that triggered this check
   * @returns Array of newly unlocked achievements
   */
  static async checkAchievements(
    userId: string | mongoose.Types.ObjectId,
    actionKey: string
  ): Promise<Array<{ achievementId: string; tier: string; isUpgrade: boolean }>> {
    try {
      const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      
      // Get user's current progress
      const user = await User.findById(userIdObj).select('progress');
      if (!user || !user.progress) return [];

      const currentValue = (user.progress as any)[actionKey] || 0;

      // Get all achievements that track this action
      const achievements = getAchievementsByAction(actionKey);
      
      const unlocked: Array<{ achievementId: string; tier: string; isUpgrade: boolean }> = [];

      for (const achievement of achievements) {
        // Find the highest tier the user has reached
        let highestUnlockedTier = null;
        for (let i = achievement.tiers.length - 1; i >= 0; i--) {
          const tier = achievement.tiers[i];
          if (currentValue >= tier.value) {
            highestUnlockedTier = tier;
            break;
          }
        }

        if (!highestUnlockedTier) continue; // User hasn't reached any tier yet

        // Check if user already has this achievement
        const existingAchievement = await UserAchievement.findOne({
          userId: userIdObj,
          achievementId: achievement.id,
        });

        if (existingAchievement) {
          // Check if it's an upgrade
          const currentTierIndex = achievement.tiers.findIndex(t => t.tier === existingAchievement.tier);
          const newTierIndex = achievement.tiers.findIndex(t => t.tier === highestUnlockedTier!.tier);
          
          if (newTierIndex > currentTierIndex) {
            const previousTier = achievement.tiers[currentTierIndex];
            const xpGain = this.getTierXp(achievement.id, highestUnlockedTier.tier) - this.getTierXp(achievement.id, previousTier?.tier);

            // Upgrade the tier
            existingAchievement.tier = highestUnlockedTier.tier;
            existingAchievement.unlockedAt = new Date();
            existingAchievement.notified = false; // Need to notify again
            await existingAchievement.save();

            unlocked.push({
              achievementId: achievement.id,
              tier: highestUnlockedTier.tier,
              isUpgrade: true,
            });

            // Award XP for the new tier (only the delta)
            if (xpGain > 0) {
              await this.addXp(userIdObj, xpGain);
            }

            // Send notification for upgrade
            await this.sendAchievementNotification(
              userIdObj,
              achievement.id,
              highestUnlockedTier.tier,
              true
            );
          }
        } else {
          // Create new achievement
          await UserAchievement.create({
            userId: userIdObj,
            achievementId: achievement.id,
            tier: highestUnlockedTier.tier,
            unlockedAt: new Date(),
            notified: false,
          });

          unlocked.push({
            achievementId: achievement.id,
            tier: highestUnlockedTier.tier,
            isUpgrade: false,
          });

            // Award XP for first unlock
            const xpGain = this.getTierXp(achievement.id, highestUnlockedTier.tier);
            if (xpGain > 0) {
              await this.addXp(userIdObj, xpGain);
            }

          // Send notification for new achievement
          await this.sendAchievementNotification(
            userIdObj,
            achievement.id,
            highestUnlockedTier.tier,
            false
          );
        }
      }

      return unlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Send notification when achievement is unlocked or upgraded
   */
  private static async sendAchievementNotification(
    userId: mongoose.Types.ObjectId,
    achievementId: string,
    tier: string,
    isUpgrade: boolean
  ): Promise<void> {
    try {
      const achievement = getAchievementById(achievementId);
      if (!achievement) return;

      const description = TIER_DESCRIPTIONS[achievementId]?.[tier] || 
        `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier unlocked!`;

      const tierEmoji = achievement.tiers.find(t => t.tier === tier)?.icon || '🏆';

      await Notification.create({
        userId,
        type: 'achievement',
        title: isUpgrade ? '🎉 Achievement Upgraded!' : '🏆 Achievement Unlocked!',
        message: `${achievement.name} – ${tier.charAt(0).toUpperCase() + tier.slice(1)} ${tierEmoji}`,
        metadata: {
          achievementId,
          tier,
          description,
          isUpgrade,
        },
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  /**
   * Get all unlocked achievements for a user
   */
  static async getUserAchievements(userId: string | mongoose.Types.ObjectId) {
    try {
      const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      
      const achievements = await UserAchievement.find({ userId: userIdObj }).lean();
      
      // Enrich with definition data
      return achievements.map(achievement => {
        const definition = getAchievementById(achievement.achievementId);
        const tierInfo = definition?.tiers.find(t => t.tier === achievement.tier);
        const description = TIER_DESCRIPTIONS[achievement.achievementId]?.[achievement.tier];
        
        return {
          ...achievement,
          name: definition?.name,
          category: definition?.category,
          tierInfo,
          description,
        };
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Get all achievement definitions with user progress
   */
  static async getAllAchievementsWithProgress(userId: string | mongoose.Types.ObjectId) {
    try {
      const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      
      const user = await User.findById(userIdObj).select('progress');
      const unlockedAchievements = await UserAchievement.find({ userId: userIdObj }).lean();
      
      const unlockedMap = new Map(
        unlockedAchievements.map(a => [a.achievementId, a.tier])
      );

      return ACHIEVEMENT_DEFINITIONS.map(achievement => {
        const currentProgress = (user?.progress as any)?.[achievement.action] || 0;
        const unlockedTier = unlockedMap.get(achievement.id);
        
        // Calculate next tier
        let nextTier = null;
        if (unlockedTier) {
          const currentIndex = achievement.tiers.findIndex(t => t.tier === unlockedTier);
          if (currentIndex < achievement.tiers.length - 1) {
            nextTier = achievement.tiers[currentIndex + 1];
          }
        } else {
          nextTier = achievement.tiers[0]; // First tier
        }

        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          currentProgress,
          unlockedTier,
          nextTier,
          tiers: achievement.tiers.map(tier => ({
            ...tier,
            unlocked: unlockedTier 
              ? achievement.tiers.findIndex(t => t.tier === unlockedTier) >= 
                achievement.tiers.findIndex(t => t.tier === tier.tier)
              : false,
            description: TIER_DESCRIPTIONS[achievement.id]?.[tier.tier],
          })),
        };
      });
    } catch (error) {
      console.error('Error getting achievements with progress:', error);
      return [];
    }
  }

  /**
   * Track and check achievement in one call (convenience method)
   */
  static async trackAndCheck(
    userId: string | mongoose.Types.ObjectId,
    actionKey: string,
    amount: number = 1
  ) {
    await this.incrementProgress(userId, actionKey, amount);
    return await this.checkAchievements(userId, actionKey);
  }

  private static getTierXp(achievementId: string, tier?: string | null): number {
    if (!tier) return 0;
    const achievement = getAchievementById(achievementId);
    const tierInfo = achievement?.tiers.find(t => t.tier === tier);
    return tierInfo?.xp ?? 0;
  }

  static computeLevel(totalXp: number): number {
    return calculateLevelFromXp(totalXp);
  }

  private static async addXp(userId: mongoose.Types.ObjectId, amount: number) {
    if (!amount || amount <= 0) return;

    const user = await User.findById(userId).select('xp level');
    if (!user) return;

    const newXp = (user.xp || 0) + amount;
    const newLevel = this.computeLevel(newXp);

    user.xp = newXp;
    user.level = newLevel;
    await user.save();
  }
}

export default AchievementService;

