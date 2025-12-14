const STORAGE_KEY = 'zn_progress';
const STATS_KEY = 'zn_reading_stats';
const ACTIVE_LESSON_KEY = 'zn_active_lesson_';

export const loadProgress = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load progress", e);
    return [];
  }
};

export const saveProgress = (completedIds: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

export const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATS_KEY);
  // Clear active lessons too if needed, but keeping them might be safer for user data
};

export const saveReadingStats = (chapterId: string, confidence: number) => {
  const stats = loadReadingStats();
  stats[chapterId] = { confidence, timestamp: Date.now() };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save reading stats", e);
  }
};

export const loadReadingStats = (): Record<string, { confidence: number, timestamp: number }> => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load stats", e);
    return {};
  }
};

export const getAverageConfidence = (): number | undefined => {
  const stats = loadReadingStats();
  const values = Object.values(stats).map((s) => s.confidence);
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const saveActiveLesson = (chapterId: string, data: any) => {
  try {
    localStorage.setItem(ACTIVE_LESSON_KEY + chapterId, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save active lesson", e);
  }
};

export const loadActiveLesson = (chapterId: string) => {
  try {
    const data = localStorage.getItem(ACTIVE_LESSON_KEY + chapterId);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};