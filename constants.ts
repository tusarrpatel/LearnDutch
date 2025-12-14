import { Chapter, DifficultyLevel, ModuleType } from './types';

export const CURRICULUM: Chapter[] = [
  // Phase 1: Beginner
  {
    id: 'p1-grammar-1',
    title: 'Grammar Foundations: Articles & Word Order',
    description: 'Understand the foundations of Dutch articles and sentence structure.',
    type: ModuleType.GRAMMAR,
    level: DifficultyLevel.BEGINNER
  },
  {
    id: 'p1-listening-1',
    title: 'Greetings & Introductions',
    description: 'Listen to common workplace greetings and identify the tone.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.BEGINNER
  },
  {
    id: 'p1-listening-2',
    title: 'Numbers & Dates',
    description: 'Understand meeting times, dates, and phone numbers.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.BEGINNER
  },
  {
    id: 'p1-listening-3',
    title: 'Office Directions',
    description: 'Listen to directions to find facilities within the office building.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.BEGINNER
  },
  {
    id: 'p1-listening-4',
    title: 'Simple Requests',
    description: 'Identify common requests for help or supplies.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.BEGINNER
  },
  {
    id: 'p1-writing-1',
    title: 'Introduce Yourself',
    description: 'Write a short paragraph introducing yourself to a new colleague.',
    type: ModuleType.WRITING,
    level: DifficultyLevel.BEGINNER
  },

  // Phase 2: Intermediate
  {
    id: 'p2-reading-1',
    title: 'Office Emails',
    description: 'Read and comprehend standard Dutch office emails.',
    type: ModuleType.READING,
    level: DifficultyLevel.INTERMEDIATE
  },
  {
    id: 'p2-grammar-1',
    title: 'Past Tenses in Reports',
    description: 'Using Perfectum and Imperfectum for work updates.',
    type: ModuleType.GRAMMAR,
    level: DifficultyLevel.INTERMEDIATE
  },
  {
    id: 'p2-listening-1',
    title: 'Voicemail Analysis',
    description: 'Understand complex voicemail messages from clients.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.INTERMEDIATE
  },
  {
    id: 'p2-listening-2',
    title: 'Team Updates',
    description: 'Follow the flow of a team stand-up meeting.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.INTERMEDIATE
  },
  {
    id: 'p2-listening-3',
    title: 'Travel Arrangements',
    description: 'Understand booking details and travel itineraries.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.INTERMEDIATE
  },
  {
    id: 'p2-conversation-1',
    title: 'The Coffee Corner',
    description: 'Small talk practice simulation with a colleague.',
    type: ModuleType.CONVERSATION,
    level: DifficultyLevel.INTERMEDIATE
  },

  // Phase 3: Professional
  {
    id: 'p3-writing-1',
    title: 'Formal Requests',
    description: 'Drafting a formal request for leave or resources.',
    type: ModuleType.WRITING,
    level: DifficultyLevel.PROFESSIONAL
  },
  {
    id: 'p3-listening-1',
    title: 'Meeting Minutes',
    description: 'Listen to a meeting excerpt and summarize key points.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.PROFESSIONAL
  },
  {
    id: 'p3-listening-2',
    title: 'Performance Review',
    description: 'Understand feedback given during a performance evaluation.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.PROFESSIONAL
  },
  {
    id: 'p3-listening-3',
    title: 'Strategic Planning',
    description: 'Comprehend a high-level presentation on company strategy.',
    type: ModuleType.LISTENING,
    level: DifficultyLevel.PROFESSIONAL
  }
];

export const MODEL_TEXT = "gemini-2.5-flash";
export const MODEL_AUDIO = "gemini-2.5-flash-preview-tts";