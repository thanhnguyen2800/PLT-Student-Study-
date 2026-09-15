export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PLAYER';
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export type User = UserProfile;


export type QuizVisibility = 'PUBLIC' | 'PRIVATE' | 'SHARED';
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECT' | 'IMAGE_QUESTION';
export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | number[] | string; // index 0..3 or array of indices
  explanation: string;
  points: number;
  timeLimit: number; // in seconds
  imageUrl?: string;
  audioUrl?: string;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  category: string;
  tags: string[];
  difficulty: QuizDifficulty;
  coverImageUrl?: string;
  visibility: QuizVisibility;
  status: QuizStatus;
  playCount: number;
  questionCount?: number;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPoints: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  duration: number; // seconds
  createdAt: string;
  answers: {
    questionId: string;
    selectedAnswer: any;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken: number;
  }[];
}

export interface AuditLog {
  id: string;
  actorUid?: string;
  actorEmail?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  target?: string;
  details?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  timestamp?: string;
  ip?: string;
  userAgent?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
}

export interface GameSession {
  id: string;
  pin: string;
  quizId: string;
  hostId: string;
  hostName: string;
  status: 'WAITING' | 'QUESTION_ACTIVE' | 'LEADERBOARD' | 'FINISHED';
  currentQuestionIndex: number;
  players: Player[];
  answers: Record<string, Record<string, any>>;
  createdAt: string;
}

export type MultiplayerGameState = 'WAITING' | 'QUESTION' | 'RESULTS' | 'FINISHED';

export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  streak: number;
  rank?: number;
  isHost?: boolean;
  isOnline: boolean;
  lastActive: number;
}

export interface PlayerAnswerRecord {
  answer: any;
  score: number;
  answeredAt: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface RealtimeGameSession {
  id: string; // 6-digit game PIN
  quizId: string;
  quizTitle: string;
  hostId: string;
  hostName: string;
  status: MultiplayerGameState;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  timeRemaining: number;
  questionStartTime: number;
  players: Record<string, GamePlayer>;
  answers: Record<string, Record<string, PlayerAnswerRecord>>; // [questionIndex][playerId]
  currentQuestion?: Question;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface GameResult {
  id: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  hostName: string;
  players: {
    id: string;
    name: string;
    score: number;
    rank: number;
    correctCount: number;
    totalQuestions: number;
    accuracy: number;
  }[];
  winner: {
    name: string;
    score: number;
  };
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

export interface CSVRowData {
  line: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  email: string;
  displayName?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  phone?: string;
}

export interface CSVImportResult {
  total: number;
  success: number;
  failed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: {
    line: number;
    email: string;
    message: string;
  }[];
}
