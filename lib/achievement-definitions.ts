/**
 * Achievement Definitions
 * Source of truth for all achievements in Foody
 */

export interface AchievementTier {
  tier: string;
  value: number;
  icon: string;
  xp?: number;
}

export interface AchievementDefinition {
  id: string;
  category: 'cooking' | 'social' | 'community';
  name: string;
  description: string;
  action: string; // Maps to User.progress field
  tiers: AchievementTier[];
  images: {
    wooden: {
      with: string;
      without: string;
    },
    stone: {
      with: string;
      without: string;
    },
    copper: {
      with: string;
      without: string;
    },
    bronze: {
      with: string;
      without: string;
    },
    silver: {
      with: string;
      without: string;
    },
    gold: {
      with: string;
      without: string;
    },
    obsidian: {
      with: string;
      without: string;
    },
    diamond: {
      with: string;
      without: string;
    },
    ruby: {
      with: string;
      without: string;
    },
    universe: {
      with: string;
      without: string;
    },
  };
}

const TIER_NAMES = [
  'wooden', 'stone', 'copper', 'bronze', 'silver',
  'gold', 'obsidian', 'diamond', 'ruby', 'universe'
];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // COOKING ACHIEVEMENTS
  {
    id: 'food_creator',
    category: 'cooking',
    name: 'Food Creator',
    description: 'Create recipes to unlock',
    action: 'recipes_created',
    images: {
      wooden: {
        with: "wooden/foodCreator_wooden_with.png",
        without: "wooden/foodCollector_wooden_without.png",
      },
      stone: {
        with: "stone/foodCreator_stone_with.png",
        without: "stone/foodCollector_stone_without.png",
      },
      copper: {
        with: "copper/foodCreator_copper_with.png",
        without: "copper/foodCollector_copper_without.png",
      },
      bronze: {
        with: "bronze/foodCreator_bronze_with.png",
        without: "bronze/foodCollector_bronze_without.png",
      },
      silver: {
        with: "silver/foodCreator_silver_with.png",
        without: "silver/foodCollector_silver_without.png",
      },
      gold: {
        with: "gold/foodCreator_gold_with.png",
        without: "gold/foodCollector_gold_without.png",
      },
      obsidian: {
        with: "obsidian/foodCreator_obsidian_with.png",
        without: "obsidian/foodCollector_obsidian_without.png",
      },
      diamond: {
        with: "diamond/foodCreator_diamond_with.png",
        without: "diamond/foodCollector_diamond_without.png",
      },
      ruby: {
        with: "ruby/foodCreator_ruby_with.png",
        without: "ruby/foodCollector_ruby_without.png",
      },
      universe: {
        with: "universe/foodCreator_universe_with.png",
        without: "universe/foodCollector_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'recipe_collector',
    category: 'cooking',
    name: 'Recipe Collector',
    description: 'Save recipes to unlock',
    action: 'recipes_saved',
    images: {
      wooden: {
        with: "wooden/recipeCollector_wooden_with.png",
        without: "wooden/recipeCollector_wooden_without.png",
      },
      stone: {
        with: "stone/recipeCollector_stone_with.png",
        without: "stone/recipeCollector_stone_without.png",
      },
      copper: {
        with: "copper/recipeCollector_copper_with.png",
        without: "copper/recipeCollector_copper_without.png",
      },
      bronze: {
        with: "bronze/recipeCollector_bronze_with.png",
        without: "bronze/recipeCollector_bronze_without.png",
      },
      silver: {
        with: "silver/recipeCollector_silver_with.png",
        without: "silver/recipeCollector_silver_without.png",
      },
      gold: {
        with: "gold/recipeCollector_gold_with.png",
        without: "gold/recipeCollector_gold_without.png",
      },
      obsidian: {
        with: "obsidian/recipeCollector_obsidian_with.png",
        without: "obsidian/recipeCollector_obsidian_without.png",
      },
      diamond: {
        with: "diamond/recipeCollector_diamond_with.png",
        without: "diamond/recipeCollector_diamond_without.png",
      },
      ruby: {
        with: "ruby/recipeCollector_ruby_with.png",
        without: "ruby/recipeCollector_ruby_without.png",
      },
      universe: {
        with: "universe/recipeCollector_universe_with.png",
        without: "universe/recipeCollector_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'picture_chef',
    category: 'cooking',
    name: 'Picture Chef',
    description: 'Analyze photos to unlock',
    action: 'photos_analyzed',
    images: {
      wooden: {
        with: "wooden/pictureChef_wooden_with.png",
        without: "wooden/pictureChef_wooden_without.png",
      },
      stone: {
        with: "stone/pictureChef_stone_with.png",
        without: "stone/pictureChef_stone_without.png",
      },
      copper: {
        with: "copper/pictureChef_copper_with.png",
        without: "copper/pictureChef_copper_without.png",
      },
      bronze: {
        with: "bronze/pictureChef_bronze_with.png",
        without: "bronze/pictureChef_bronze_without.png",
      },
      silver: {
        with: "silver/pictureChef_silver_with.png",
        without: "silver/pictureChef_silver_without.png",
      },
      gold: {
        with: "gold/pictureChef_gold_with.png",
        without: "gold/pictureChef_gold_without.png",
      },
      obsidian: {
        with: "obsidian/pictureChef_obsidian_with.png",
        without: "obsidian/pictureChef_obsidian_without.png",
      },
      diamond: {
        with: "diamond/pictureChef_diamond_with.png",
        without: "diamond/pictureChef_diamond_without.png",
      },
      ruby: {
        with: "ruby/pictureChef_ruby_with.png",
        without: "ruby/pictureChef_ruby_without.png",
      },
      universe: {
        with: "universe/pictureChef_universe_with.png",
        without: "universe/pictureChef_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'link_chef',
    category: 'cooking',
    name: 'Link Chef',
    description: 'Import recipes to unlock',
    action: 'recipes_imported',
    images: {
      wooden: {
        with: "wooden/linkChef_wooden_with.png",
        without: "wooden/linkChef_wooden_without.png",
      },
      stone: {
        with: "stone/linkChef_stone_with.png",
        without: "stone/linkChef_stone_without.png",
      },
      copper: {
        with: "copper/linkChef_copper_with.png",
        without: "copper/linkChef_copper_without.png",
      },
      bronze: {
        with: "bronze/linkChef_bronze_with.png",
        without: "bronze/linkChef_bronze_without.png",
      },
      silver: {
        with: "silver/linkChef_silver_with.png",
        without: "silver/linkChef_silver_without.png",
      },
      gold: {
        with: "gold/linkChef_gold_with.png",
        without: "gold/linkChef_gold_without.png",
      },
      obsidian: {
        with: "obsidian/linkChef_obsidian_with.png",
        without: "obsidian/linkChef_obsidian_without.png",
      },
      diamond: {
        with: "diamond/linkChef_diamond_with.png",
        without: "diamond/linkChef_diamond_without.png",
      },
      ruby: {
        with: "ruby/linkChef_ruby_with.png",
        without: "ruby/linkChef_ruby_without.png",
      },
      universe: {
        with: "universe/linkChef_universe_with.png",
        without: "universe/linkChef_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'ai_chef',
    category: 'cooking',
    name: 'AI Chef',
    description: 'Generate AI recipes to unlock',
    action: 'ai_recipes_generated',
    images: {
      wooden: {
        with: "wooden/aiChef_wooden_with.png",
        without: "wooden/aiChef_wooden_without.png",
      },
      stone: {
        with: "stone/aiChef_stone_with.png",
        without: "stone/aiChef_stone_without.png",
      },
      copper: {
        with: "copper/aiChef_copper_with.png",
        without: "copper/aiChef_copper_without.png",
      },
      bronze: {
        with: "bronze/aiChef_bronze_with.png",
        without: "bronze/aiChef_bronze_without.png",
      },
      silver: {
        with: "silver/aiChef_silver_with.png",
        without: "silver/aiChef_silver_without.png",
      },
      gold: {
        with: "gold/aiChef_gold_with.png",
        without: "gold/aiChef_gold_without.png",
      },
      obsidian: {
        with: "obsidian/aiChef_obsidian_with.png",
        without: "obsidian/aiChef_obsidian_without.png",
      },
      diamond: {
        with: "diamond/aiChef_diamond_with.png",
        without: "diamond/aiChef_diamond_without.png",
      },
      ruby: {
        with: "ruby/aiChef_ruby_with.png",
        without: "ruby/aiChef_ruby_without.png",
      },
      universe: {
        with: "universe/aiChef_universe_with.png",
        without: "universe/aiChef_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '⭐', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  
  // SOCIAL ACHIEVEMENTS
  {
    id: 'social_chef',
    category: 'social',
    name: 'Social Chef',
    description: 'Create posts to unlock',
    action: 'posts_created',
    images: {
      wooden: {
        with: "wooden/socialChef_wooden_with.png",
        without: "wooden/socialChef_wooden_without.png",
      },
      stone: {
        with: "stone/socialChef_stone_with.png",
        without: "stone/socialChef_stone_without.png",
      },
      copper: {
        with: "copper/socialChef_copper_with.png",
        without: "copper/socialChef_copper_without.png",
      },
      bronze: {
        with: "bronze/socialChef_bronze_with.png",
        without: "bronze/socialChef_bronze_without.png",
      },
      silver: {
        with: "silver/socialChef_silver_with.png",
        without: "silver/socialChef_silver_without.png",
      },
      gold: {
        with: "gold/socialChef_gold_with.png",
        without: "gold/socialChef_gold_without.png",
      },
      obsidian: {
        with: "obsidian/socialChef_obsidian_with.png",
        without: "obsidian/socialChef_obsidian_without.png",
      },
      diamond: {
        with: "diamond/socialChef_diamond_with.png",
        without: "diamond/socialChef_diamond_without.png",
      },
      ruby: {
        with: "ruby/socialChef_ruby_with.png",
        without: "ruby/socialChef_ruby_without.png",
      },
      universe: {
        with: "universe/socialChef_universe_with.png",
        without: "universe/socialChef_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'like_legend',
    category: 'social',
    name: 'Like Legend',
    description: 'Give likes to unlock',
    action: 'likes_given',
    images: {
      wooden: {
        with: "wooden/likeLegend_wooden_with.png",
        without: "wooden/likeLegend_wooden_without.png",
      },
      stone: {
        with: "stone/likeLegend_stone_with.png",
        without: "stone/likeLegend_stone_without.png",
      },
      copper: {
        with: "copper/likeLegend_copper_with.png",
        without: "copper/likeLegend_copper_without.png",
      },
      bronze: {
        with: "bronze/likeLegend_bronze_with.png",
        without: "bronze/likeLegend_bronze_without.png",
      },
      silver: {
        with: "silver/likeLegend_silver_with.png",
        without: "silver/likeLegend_silver_without.png",
      },
      gold: {
        with: "gold/likeLegend_gold_with.png",
        without: "gold/likeLegend_gold_without.png",
      },
      obsidian: {
        with: "obsidian/likeLegend_obsidian_with.png",
        without: "obsidian/likeLegend_obsidian_without.png",
      },
      diamond: {
        with: "diamond/likeLegend_diamond_with.png",
        without: "diamond/likeLegend_diamond_without.png",
      },
      ruby: {
        with: "ruby/likeLegend_ruby_with.png",
        without: "ruby/likeLegend_ruby_without.png",
      },
      universe: {
        with: "universe/likeLegend_universe_with.png",
        without: "universe/likeLegend_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'comment_connoisseur',
    category: 'social',
    name: 'Comment Connoisseur',
    description: 'Comment on posts to unlock',
    action: 'comments_created',
    images: {
      wooden: {
        with: "wooden/commentConnoisseur_wooden_with.png",
        without: "wooden/commentConnoisseur_wooden_without.png",
      },
      stone: {
        with: "stone/commentConnoisseur_stone_with.png",
        without: "stone/commentConnoisseur_stone_without.png",
      },
      copper: {
        with: "copper/commentConnoisseur_copper_with.png",
        without: "copper/commentConnoisseur_copper_without.png",
      },
      bronze: {
        with: "bronze/commentConnoisseur_bronze_with.png",
        without: "bronze/commentConnoisseur_bronze_without.png",
      },
      silver: {
        with: "silver/commentConnoisseur_silver_with.png",
        without: "silver/commentConnoisseur_silver_without.png",
      },
      gold: {
        with: "gold/commentConnoisseur_gold_with.png",
        without: "gold/commentConnoisseur_gold_without.png",
      },
      obsidian: {
        with: "obsidian/commentConnoisseur_obsidian_with.png",
        without: "obsidian/commentConnoisseur_obsidian_without.png",
      },
      diamond: {
        with: "diamond/commentConnoisseur_diamond_with.png",
        without: "diamond/commentConnoisseur_diamond_without.png",
      },
      ruby: {
        with: "ruby/commentConnoisseur_ruby_with.png",
        without: "ruby/commentConnoisseur_ruby_without.png",
      },
      universe: {
        with: "universe/commentConnoisseur_universe_with.png",
        without: "universe/commentConnoisseur_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '⭐', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },
  {
    id: 'food_influencer',
    category: 'social',
    name: 'Food Influencer',
    description: 'Gain followers to unlock',
    action: 'followers_count',
    images: {
      wooden: {
        with: "wooden/foodInfluencer_wooden_with.png",
        without: "wooden/foodInfluencer_wooden_without.png",
      },
      stone: {
        with: "stone/foodInfluencer_stone_with.png",
        without: "stone/foodInfluencer_stone_without.png",
      },
      copper: {
        with: "copper/foodInfluencer_copper_with.png",
        without: "copper/foodInfluencer_copper_without.png",
      },
      bronze: {
        with: "bronze/foodInfluencer_bronze_with.png",
        without: "bronze/foodInfluencer_bronze_without.png",
      },
      silver: {
        with: "silver/foodInfluencer_silver_with.png",
        without: "silver/foodInfluencer_silver_without.png",
      },
      gold: {
        with: "gold/foodInfluencer_gold_with.png",
        without: "gold/foodInfluencer_gold_without.png",
      },
      obsidian: {
        with: "obsidian/foodInfluencer_obsidian_with.png",
        without: "obsidian/foodInfluencer_obsidian_without.png",
      },
      diamond: {
        with: "diamond/foodInfluencer_diamond_with.png",
        without: "diamond/foodInfluencer_diamond_without.png",
      },
      ruby: {
        with: "ruby/foodInfluencer_ruby_with.png",
        without: "ruby/foodInfluencer_ruby_without.png",
      },
      universe: {
        with: "universe/foodInfluencer_universe_with.png",
        without: "universe/foodInfluencer_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 5, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 10, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 25, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 50, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 100, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 200, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 350, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 500, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 1000, icon: '🌌', xp: 6000 },
    ],
  },

  // COMMUNITY ACHIEVEMENTS
  {
    id: 'household_hero',
    category: 'community',
    name: 'Household Hero',
    description: 'Participate in household activities',
    action: 'household_actions',
    images: {
      wooden: {
        with: "wooden/houseHold_wooden_with.png",
        without: "wooden/houseHold_wooden_without.png",
      },
      stone: {
        with: "stone/houseHold_stone_with.png",
        without: "stone/houseHold_stone_without.png",
      },
      copper: {
        with: "copper/houseHold_copper_with.png",
        without: "copper/houseHold_copper_without.png",
      },
      bronze: {
        with: "bronze/houseHold_bronze_with.png",
        without: "bronze/houseHold_bronze_without.png",
      },
      silver: {
        with: "silver/houseHold_stone_with.png",
        without: "silver/houseHold_silver_without.png",
      },
      gold: {
        with: "gold/houseHold_stone_with.png",
        without: "gold/houseHold_gold_without.png",
      },
      obsidian: {
        with: "obsidian/houseHold_stone_with.png",
        without: "obsidian/houseHold_obsidian_without.png",
      },
      diamond: {
        with: "diamond/houseHold_diamond_with.png",
        without: "diamond/houseHold_diamond_without.png",
      },
      ruby: {
        with: "ruby/houseHold_ruby_with.png",
        without: "ruby/houseHold_ruby_without.png",
      },
      universe: {
        with: "universe/houseHold_universe_with.png",
        without: "universe/houseHold_universe_without.png",
      },
    },
    tiers: [
      { tier: 'wooden', value: 1, icon: '🪵', xp: 10 },
      { tier: 'stone', value: 3, icon: '🪨', xp: 25 },
      { tier: 'copper', value: 5, icon: '🟤', xp: 50 },
      { tier: 'bronze', value: 10, icon: '🥉', xp: 100 },
      { tier: 'silver', value: 20, icon: '🥈', xp: 200 },
      { tier: 'gold', value: 40, icon: '🥇', xp: 400 },
      { tier: 'obsidian', value: 75, icon: '⚫', xp: 800 },
      { tier: 'diamond', value: 125, icon: '💎', xp: 1500 },
      { tier: 'ruby', value: 200, icon: '♦️', xp: 3000 },
      { tier: 'universe', value: 350, icon: '🌌', xp: 6000 },
    ],
  },
];

// Helper functions
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
}

export function getAchievementsByAction(action: string): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.action === action);
}

export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

export function getTierInfo(achievementId: string, tierName: string): AchievementTier | undefined {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return undefined;
  return achievement.tiers.find(t => t.tier === tierName);
}

// Tier descriptions
export const TIER_DESCRIPTIONS: Record<string, Record<string, string>> = {
  food_creator: {
    wooden: "Just getting started - every chef begins somewhere.",
    stone: "Cooking up a storm - keep it sizzling!",
    copper: "Pan-tastic progress - your skills are heating up!",
    bronze: "Seasoned chef - your kitchen prowess is growing.",
    silver: "Sizzling success - you're on fire in the kitchen!",
    gold: "Flavor maestro - your dishes are top-notch!",
    obsidian: "Master chef - your creations are truly gourmet.",
    diamond: "Culinary genius - you shine brighter than a diamond.",
    ruby: "Legendary chef - you rule the kitchen!",
    universe: "Galactic gourmet - you've reached a whole new level of cooking!"
  },
  recipe_collector: {
    wooden: "First taste - your cookbook is just beginning.",
    stone: "Building your pantry - every recipe adds flavor.",
    copper: "Flavor hoarder - collecting tasty ideas.",
    bronze: "Recipe librarian - your collection is growing.",
    silver: "Seasoned collector - your pantry is well-stocked.",
    gold: "Gourmet archivist - your recipes are top-tier.",
    obsidian: "Master hoarder - your recipe vault is massive.",
    diamond: "Kitchen connoisseur - you sparkle with variety.",
    ruby: "Legendary collector - your cookbook is epic.",
    universe: "Cosmic chef - your recipe universe is endless!"
  },
  picture_chef: {
    wooden: "Picture perfect start - your first dish is captured.",
    stone: "Focus on flavor - your photos are getting tasty.",
    copper: "Snap and savor - food for the eyes!",
    bronze: "Culinary photographer - capturing yummy moments.",
    silver: "Visual feast - your images are mouthwatering.",
    gold: "Photo guru - you capture flavor flawlessly.",
    obsidian: "Scene chef - every plate is a masterpiece.",
    diamond: "Sharp shooter - your pictures shine bright.",
    ruby: "Gallery of taste - your feed is a food magazine.",
    universe: "Galactic gallery - your food photos are out of this world!"
  },
  link_chef: {
    wooden: "Connected kitchen - imported your first recipe!",
    stone: "Digital diner - your cookbook is getting connected.",
    copper: "Networking palate - collecting global flavors.",
    bronze: "Web gourmand - your pantry is worldwide!",
    silver: "Social foodie - your kitchen is online!",
    gold: "Global chef - collecting recipes from everywhere.",
    obsidian: "Online gourmand - your social feed is spicy.",
    diamond: "Network star - shining with shared recipes.",
    ruby: "Legendary importer - world cuisines at your fingertips.",
    universe: "Universal chef - your connections are limitless!"
  },
  ai_chef: {
    wooden: "Tech-savvy cook - created your first AI recipe!",
    stone: "Digital sous-chef - experimenting with flavor!",
    copper: "Machine gourmand - cooking from code!",
    bronze: "AI artisan - your digital chef skills rise.",
    silver: "Algorithmic chef - cooking with next-gen tech!",
    gold: "Cyber chef - high-tech flavors unlocked!",
    obsidian: "Neural nibble - futuristic recipes incoming!",
    diamond: "Quantum cook - your recipes are brilliant!",
    ruby: "Robo cuisine master - mechanical brilliance in every dish!",
    universe: "Galactic AI guru - your cooking transcends reality!"
  },
  social_chef: {
    wooden: "Sharing is caring - posted your first dish!",
    stone: "Keep 'em hungry - another post shared.",
    copper: "Foodie influencer - your voice is getting louder.",
    bronze: "Culinary communicator - recipes and stories flowing.",
    silver: "Dish director - commanding the feed.",
    gold: "Flavor storyteller - everyone's tuning in!",
    obsidian: "Feed favorite - your posts are spicy!",
    diamond: "Trendsetter - influencers are watching you!",
    ruby: "Viral chef - your posts are legendary!",
    universe: "Global gourmand - you're on everyone's menu!"
  },
  like_legend: {
    wooden: "First like given - spreading some love!",
    stone: "You're warming hearts - keep liking!",
    copper: "Social butter - a pat on the back!",
    bronze: "Engagement chef - your likes are cooking up buzz!",
    silver: "Community darling - everyone appreciates your support!",
    gold: "Top taster - your likes are golden!",
    obsidian: "Flavor booster - your support is spicy!",
    diamond: "Social star - you're shining with likes!",
    ruby: "Royal of likes - your support is ruby-worthy!",
    universe: "Galactic maestro - you light up the universe with likes!"
  },
  comment_connoisseur: {
    wooden: "First comment - the conversation begins!",
    stone: "Spicing up the chat - keep commenting!",
    copper: "Flavorful feedback - sharing your thoughts!",
    bronze: "Community chef - your words enrich posts!",
    silver: "Side-dish storyteller - your comments are delicious!",
    gold: "Master of menu talk - your comments sparkle!",
    obsidian: "Savory speaker - your voice is mouthwatering!",
    diamond: "Social seasoning - adding zest everywhere!",
    ruby: "Chatty champion - your feedback is ruby!",
    universe: "Galactic gastronaut - your commentary knows no bounds!"
  },
  food_influencer: {
    wooden: "First follower - you've got fans!",
    stone: "Building your fan club - audience growing!",
    copper: "Spreading the flavor - more people tuning in!",
    bronze: "Rising chef - people love your content!",
    silver: "Community cooker - your fanbase is expanding!",
    gold: "Popular palate - your taste is respected!",
    obsidian: "Superstar chef - your follower count is huge!",
    diamond: "Legend in the kitchen - people look up to you!",
    ruby: "Global gourmet - your reach is worldwide!",
    universe: "Cosmic chef - a legend in every galaxy!"
  },
  household_hero: {
    wooden: "First home kitchen - household created!",
    stone: "Bringing others to the table - invited a member.",
    copper: "Family potluck - a few more have joined.",
    bronze: "First family recipe - shared a meal idea!",
    silver: "Household party - five members gathering!",
    gold: "Seasoned host - five recipes shared at home.",
    obsidian: "Kitchen boss - inviting more flavor lovers!",
    diamond: "Family feast - your kitchen is always cooking!",
    ruby: "Host with the most - dozens of recipes shared!",
    universe: "Galactic host - your family kitchen is legendary!"
  }
};

