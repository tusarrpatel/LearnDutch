export enum ModuleType {
  GRAMMAR = 'Grammar',
  READING = 'Reading',
  WRITING = 'Writing',
  LISTENING = 'Listening',
  CONVERSATION = 'Conversation'
}

export enum DifficultyLevel {
  BEGINNER = 'Beginner (A1-A2)',
  INTERMEDIATE = 'Intermediate (B1)',
  PROFESSIONAL = 'Professional (B2+)'
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  level: DifficultyLevel;
  isCompleted?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  pronunciationFeedback?: string;
  pronunciationScore?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WritingFeedback {
  correctedText: string;
  critique: string;
  score: number; // 1-10
}

export interface ReadingContent {
  title: string;
  text: string;
  glossary: Record<string, string>;
  questions: QuizQuestion[];
}

export interface ListeningExercise {
  transcript: string; // Hidden from user initially
  audioBase64?: string;
  questions: QuizQuestion[];
}

// SRS Types
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number; // Days
  repetition: number;
  easeFactor: number;
  nextReviewDate: number; // Unix timestamp
  source?: string; // e.g., 'Grammar: Word Order'
}

export interface GrammarContent {
  topic?: string;
  explanation: string;
  quiz: QuizQuestion[];
  flashcards: { front: string; back: string }[];
}