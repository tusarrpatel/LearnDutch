import { Flashcard } from '../types';

const STORAGE_KEY = 'zn_flashcards_deck';

export const loadDeck = (): Flashcard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load deck", e);
    return [];
  }
};

export const saveDeck = (deck: Flashcard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
  } catch (e) {
    console.error("Failed to save deck", e);
  }
};

export const createCard = (front: string, back: string, source?: string): Flashcard => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    front,
    back,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(), // Due immediately
    source
  };
};

// SuperMemo-2 Algorithm
// Quality: 0 (blackout) to 5 (perfect)
export const calculateReview = (card: Flashcard, quality: number): Flashcard => {
  let { interval, repetition, easeFactor } = card;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    // Update EF based on SM-2 formula
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  } else {
    // If user forgot, reset repetitions and interval
    repetition = 0;
    interval = 1;
  }

  // Calculate next date (Interval is in days)
  const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    interval,
    repetition,
    easeFactor,
    nextReviewDate
  };
};

export const getDueCards = (deck: Flashcard[]): Flashcard[] => {
  const now = Date.now();
  return deck.filter(card => card.nextReviewDate <= now);
};
