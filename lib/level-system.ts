const MAX_LEVEL = 200;
const MAX_XP = 120_850;

/**
 * Total XP needed to reach a given level
 * Level starts at 1 (which requires 0 XP)
 */
export function getTotalXpForLevel(level: number): number {
  if (level < 1) return 0;
  if (level > MAX_LEVEL) level = MAX_LEVEL;

  // Use (level - 1) so that Level 1 = 0 XP, Level 2 = scale, etc.
  const scale = MAX_XP / ((MAX_LEVEL - 1) * (MAX_LEVEL - 1));
  return Math.round(scale * (level - 1) * (level - 1));
}

/**
 * XP required to go from (level - 1) → level
 */
export function getXpForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;

  return (
    getTotalXpForLevel(level + 1) -
    getTotalXpForLevel(level)
  );
}

/**
 * Calculate the user's level based on their current XP
 * Uses binary search for efficiency
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  if (xp >= MAX_XP) return MAX_LEVEL;

  let left = 1;
  let right = MAX_LEVEL;
  let currentLevel = 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const xpForMid = getTotalXpForLevel(mid);

    if (xpForMid <= xp) {
      currentLevel = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return currentLevel;
}

/**
 * Get XP progress for current level
 * Returns: { currentLevel, xpInLevel, xpForNextLevel, progress }
 */
export function getXpProgress(xp: number) {
  const currentLevel = calculateLevelFromXp(xp);
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpForNext = getTotalXpForLevel(currentLevel + 1);
  const xpInLevel = xp - xpForCurrentLevel;
  const xpForNextLevel = xpForNext - xpForCurrentLevel;
  const progress = xpForNextLevel > 0 ? (xpInLevel / xpForNextLevel) * 100 : 100;

  return {
    currentLevel,
    xpInLevel,
    xpForNextLevel,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export { MAX_LEVEL, MAX_XP };

