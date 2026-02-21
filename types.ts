
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizDefinition {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: number;
  originalContent?: string;
}

export interface QuizSession extends QuizDefinition {
  isActive?: boolean;
}

export interface StudentResponse {
  studentName: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface LiveStats {
  [questionId: string]: {
    total: number;
    correct: number;
    responses: { [optionIndex: number]: number };
  };
}

export type SessionStatus = 'WAITING' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'FINISHED';

export interface SessionState {
  currentQuestionIndex: number;
  status: SessionStatus;
  startTime: number;
  endTime?: number;
  totalQuestions: number;
}


export enum AppView {
  LOGIN = 'LOGIN',
  TRAINER_DASHBOARD = 'TRAINER_DASHBOARD',
  CREATE_QUIZ = 'CREATE_QUIZ',
  LIVE_SESSION = 'LIVE_SESSION',
  STUDENT_JOIN = 'STUDENT_JOIN',
  STUDENT_QUIZ = 'STUDENT_QUIZ',
  PRICING = 'PRICING'
}

declare global {
  interface Window {
    _env_: any;
  }
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface UserLimit {
  maxQuizzes: number;
  maxActiveSessions: number;
  maxParticipantsPerSession: number;
  aiGenerationLimit: number; // Monthly
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: number;
  lastLogin: number;
  limits: UserLimit;
  usage: {
    quizzesCreated: number;
    aiGenerationsUsed: number;
  };
}

export const TIER_LIMITS: Record<SubscriptionTier, UserLimit> = {
  [SubscriptionTier.FREE]: {
    maxQuizzes: 3,
    maxActiveSessions: 1,
    maxParticipantsPerSession: 50,
    aiGenerationLimit: 10
  },
  [SubscriptionTier.PRO]: {
    maxQuizzes: 50,
    maxActiveSessions: 5,
    maxParticipantsPerSession: 500,
    aiGenerationLimit: 500
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxQuizzes: 9999,
    maxActiveSessions: 9999,
    maxParticipantsPerSession: 9999,
    aiGenerationLimit: 9999
  }
};

