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
}

const TIER_NAMES = [
  'wooden', 'stone', 'copper', 'bronze', 'silver',
  'gold', 'obsidian', 'diamond', 'ruby', 'universe'
];

const TIER_XP = [10, 25, 50, 100, 200, 400, 800, 1500, 3000, 6000];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // COOKING ACHIEVEMENTS
  {
    id: 'food_creator',
    category: 'cooking',
    name: 'Food Creator',
    description: 'Create recipes to unlock',
    action: 'recipes_created',
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
    wooden: "Just getting started – every chef begins somewhere.",
    stone: "Cooking up a storm – keep it sizzling!",
    copper: "Pan-tastic progress – your skills are heating up!",
    bronze: "Seasoned chef – your kitchen prowess is growing.",
    silver: "Sizzling success – you're on fire in the kitchen!",
    gold: "Flavor maestro – your dishes are top-notch!",
    obsidian: "Master chef – your creations are truly gourmet.",
    diamond: "Culinary genius – you shine brighter than a diamond.",
    ruby: "Legendary chef – you rule the kitchen!",
    universe: "Galactic gourmet – you've reached a whole new level of cooking!"
  },
  recipe_collector: {
    wooden: "First taste – your cookbook is just beginning.",
    stone: "Building your pantry – every recipe adds flavor.",
    copper: "Flavor hoarder – collecting tasty ideas.",
    bronze: "Recipe librarian – your collection is growing.",
    silver: "Seasoned collector – your pantry is well-stocked.",
    gold: "Gourmet archivist – your recipes are top-tier.",
    obsidian: "Master hoarder – your recipe vault is massive.",
    diamond: "Kitchen connoisseur – you sparkle with variety.",
    ruby: "Legendary collector – your cookbook is epic.",
    universe: "Cosmic chef – your recipe universe is endless!"
  },
  picture_chef: {
    wooden: "Picture perfect start – your first dish is captured.",
    stone: "Focus on flavor – your photos are getting tasty.",
    copper: "Snap and savor – food for the eyes!",
    bronze: "Culinary photographer – capturing yummy moments.",
    silver: "Visual feast – your images are mouthwatering.",
    gold: "Photo guru – you capture flavor flawlessly.",
    obsidian: "Scene chef – every plate is a masterpiece.",
    diamond: "Sharp shooter – your pictures shine bright.",
    ruby: "Gallery of taste – your feed is a food magazine.",
    universe: "Galactic gallery – your food photos are out of this world!"
  },
  link_chef: {
    wooden: "Connected kitchen – imported your first recipe!",
    stone: "Digital diner – your cookbook is getting connected.",
    copper: "Networking palate – collecting global flavors.",
    bronze: "Web gourmand – your pantry is worldwide!",
    silver: "Social foodie – your kitchen is online!",
    gold: "Global chef – collecting recipes from everywhere.",
    obsidian: "Online gourmand – your social feed is spicy.",
    diamond: "Network star – shining with shared recipes.",
    ruby: "Legendary importer – world cuisines at your fingertips.",
    universe: "Universal chef – your connections are limitless!"
  },
  ai_chef: {
    wooden: "Tech-savvy cook – created your first AI recipe!",
    stone: "Digital sous-chef – experimenting with flavor!",
    copper: "Machine gourmand – cooking from code!",
    bronze: "AI artisan – your digital chef skills rise.",
    silver: "Algorithmic chef – cooking with next-gen tech!",
    gold: "Cyber chef – high-tech flavors unlocked!",
    obsidian: "Neural nibble – futuristic recipes incoming!",
    diamond: "Quantum cook – your recipes are brilliant!",
    ruby: "Robo cuisine master – mechanical brilliance in every dish!",
    universe: "Galactic AI guru – your cooking transcends reality!"
  },
  social_chef: {
    wooden: "Sharing is caring – posted your first dish!",
    stone: "Keep 'em hungry – another post shared.",
    copper: "Foodie influencer – your voice is getting louder.",
    bronze: "Culinary communicator – recipes and stories flowing.",
    silver: "Dish director – commanding the feed.",
    gold: "Flavor storyteller – everyone's tuning in!",
    obsidian: "Feed favorite – your posts are spicy!",
    diamond: "Trendsetter – influencers are watching you!",
    ruby: "Viral chef – your posts are legendary!",
    universe: "Global gourmand – you're on everyone's menu!"
  },
  like_legend: {
    wooden: "First like given – spreading some love!",
    stone: "You're warming hearts – keep liking!",
    copper: "Social butter – a pat on the back!",
    bronze: "Engagement chef – your likes are cooking up buzz!",
    silver: "Community darling – everyone appreciates your support!",
    gold: "Top taster – your likes are golden!",
    obsidian: "Flavor booster – your support is spicy!",
    diamond: "Social star – you're shining with likes!",
    ruby: "Royal of likes – your support is ruby-worthy!",
    universe: "Galactic maestro – you light up the universe with likes!"
  },
  comment_connoisseur: {
    wooden: "First comment – the conversation begins!",
    stone: "Spicing up the chat – keep commenting!",
    copper: "Flavorful feedback – sharing your thoughts!",
    bronze: "Community chef – your words enrich posts!",
    silver: "Side-dish storyteller – your comments are delicious!",
    gold: "Master of menu talk – your comments sparkle!",
    obsidian: "Savory speaker – your voice is mouthwatering!",
    diamond: "Social seasoning – adding zest everywhere!",
    ruby: "Chatty champion – your feedback is ruby!",
    universe: "Galactic gastronaut – your commentary knows no bounds!"
  },
  food_influencer: {
    wooden: "First follower – you've got fans!",
    stone: "Building your fan club – audience growing!",
    copper: "Spreading the flavor – more people tuning in!",
    bronze: "Rising chef – people love your content!",
    silver: "Community cooker – your fanbase is expanding!",
    gold: "Popular palate – your taste is respected!",
    obsidian: "Superstar chef – your follower count is huge!",
    diamond: "Legend in the kitchen – people look up to you!",
    ruby: "Global gourmet – your reach is worldwide!",
    universe: "Cosmic chef – a legend in every galaxy!"
  },
  household_hero: {
    wooden: "First home kitchen – household created!",
    stone: "Bringing others to the table – invited a member.",
    copper: "Family potluck – a few more have joined.",
    bronze: "First family recipe – shared a meal idea!",
    silver: "Household party – five members gathering!",
    gold: "Seasoned host – five recipes shared at home.",
    obsidian: "Kitchen boss – inviting more flavor lovers!",
    diamond: "Family feast – your kitchen is always cooking!",
    ruby: "Host with the most – dozens of recipes shared!",
    universe: "Galactic host – your family kitchen is legendary!"
  }
};

