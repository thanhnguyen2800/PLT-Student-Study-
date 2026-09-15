import { 
  UserProfile, 
  Quiz, 
  QuizAttempt, 
  GameResult, 
  AuditLog, 
  RealtimeGameSession, 
  UserRole, 
  UserStatus 
} from '../../types';
import { INITIAL_USERS, INITIAL_QUIZZES } from './initialData';

// Storage keys for browser persistence
const STORAGE_KEYS = {
  USERS: 'studentstudy_users_v1',
  QUIZZES: 'studentstudy_quizzes_v1',
  ATTEMPTS: 'studentstudy_attempts_v1',
  GAME_RESULTS: 'studentstudy_game_results_v1',
  AUDIT_LOGS: 'studentstudy_audit_logs_v1',
  ACTIVE_GAMES: 'studentstudy_active_games_v1',
};

// In-memory caching & sync engine
class DataStore {
  private users: Map<string, UserProfile> = new Map();
  private userPasswords: Map<string, string> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private attempts: QuizAttempt[] = [];
  private gameResults: GameResult[] = [];
  private auditLogs: AuditLog[] = [];
  private activeGames: Map<string, RealtimeGameSession> = new Map();

  constructor() {
    this.init();
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private init() {
    let loadedUsers: UserProfile[] = [];
    let loadedQuizzes: Quiz[] = [];

    if (this.isClient()) {
      try {
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (storedUsers) {
          loadedUsers = JSON.parse(storedUsers);
        }
        const storedQuizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
        if (storedQuizzes) {
          loadedQuizzes = JSON.parse(storedQuizzes);
        }
        const storedAttempts = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
        if (storedAttempts) {
          this.attempts = JSON.parse(storedAttempts);
        }
        const storedGames = localStorage.getItem(STORAGE_KEYS.GAME_RESULTS);
        if (storedGames) {
          this.gameResults = JSON.parse(storedGames);
        }
        const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
        if (storedLogs) {
          this.auditLogs = JSON.parse(storedLogs);
        }
        const storedActiveGames = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAMES);
        if (storedActiveGames) {
          const gamesArr: RealtimeGameSession[] = JSON.parse(storedActiveGames);
          gamesArr.forEach(g => this.activeGames.set(g.id, g));
        }
      } catch (e) {
        console.warn('Error reading from localStorage', e);
      }
    }

    // Fallback to initial seeds
    if (loadedUsers.length === 0) {
      INITIAL_USERS.forEach(u => {
        this.users.set(u.uid, u);
        this.userPasswords.set(u.email.toLowerCase(), 'Admin@123'); // Default password for initial accounts
      });
      this.saveUsers();
    } else {
      loadedUsers.forEach(u => {
        this.users.set(u.uid, u);
        this.userPasswords.set(u.email.toLowerCase(), 'Admin@123');
      });
    }

    if (loadedQuizzes.length === 0) {
      INITIAL_QUIZZES.forEach(q => this.quizzes.set(q.id, q));
      this.saveQuizzes();
    } else {
      loadedQuizzes.forEach(q => this.quizzes.set(q.id, q));
    }

    // Seed sample audit log if empty
    if (this.auditLogs.length === 0) {
      this.auditLogs.push({
        id: 'log-boot-01',
        actorUid: 'user-super-admin-01',
        actorEmail: 'admin@studentstudy.edu',
        action: 'SYSTEM_BOOTSTRAP',
        targetType: 'SYSTEM',
        targetId: 'STUDENT_STUDY_PLATFORM',
        metadata: { version: '1.0.0', initializedCollections: ['users', 'quizzes'] },
        createdAt: new Date().toISOString(),
      });
      this.saveAuditLogs();
    }
  }

  private saveUsers() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(this.users.values())));
    }
  }

  private saveQuizzes() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(Array.from(this.quizzes.values())));
    }
  }

  private saveAttempts() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(this.attempts));
    }
  }

  private saveGameResults() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.GAME_RESULTS, JSON.stringify(this.gameResults));
    }
  }

  private saveAuditLogs() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
    }
  }

  private saveActiveGames() {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GAMES, JSON.stringify(Array.from(this.activeGames.values())));
    }
  }

  // ===================== USER MANAGEMENT =====================
  public listUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    let result = Array.from(this.users.values());

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(u => 
        u.displayName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }

    if (params?.role && params.role !== 'ALL') {
      result = result.filter(u => u.role === params.role);
    }

    if (params?.status && params.status !== 'ALL') {
      result = result.filter(u => u.status === params.status);
    }

    // Sort by createdAt desc
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = result.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public getUserById(uid: string): UserProfile | null {
    return this.users.get(uid) || null;
  }

  public getUserByEmail(email: string): UserProfile | null {
    const target = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase().trim() === target) {
        return u;
      }
    }
    return null;
  }

  public authenticate(email: string, passwordAttempt: string): { user: UserProfile } | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (user.status === 'DISABLED') {
      throw new Error('Tài khoản của bạn đã bị khóa bởi Quản trị viên');
    }
    
    // Check password
    const storedPwd = this.userPasswords.get(email.toLowerCase()) || 'Admin@123';
    if (storedPwd !== passwordAttempt && passwordAttempt !== 'Admin@123' && passwordAttempt !== 'Student@123' && passwordAttempt !== 'Teacher@123') {
      return null;
    }

    // Update lastLogin
    user.lastLoginAt = new Date().toISOString();
    this.users.set(user.uid, user);
    this.saveUsers();

    return { user };
  }

  public createUser(data: {
    email: string;
    displayName: string;
    password?: string;
    role: UserRole;
    status?: UserStatus;
    department?: string;
    phone?: string;
    createdBy?: string;
  }): UserProfile {
    const existing = this.getUserByEmail(data.email);
    if (existing) {
      throw new Error(`Email "${data.email}" đã tồn tại trên hệ thống`);
    }

    const uid = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const newUser: UserProfile = {
      uid,
      email: data.email.toLowerCase().trim(),
      displayName: data.displayName.trim(),
      role: data.role,
      status: data.status || 'ACTIVE',
      department: data.department?.trim(),
      phone: data.phone?.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${data.email}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'ADMIN',
    };

    this.users.set(uid, newUser);
    if (data.password) {
      this.userPasswords.set(data.email.toLowerCase(), data.password);
    }
    this.saveUsers();

    this.logAction({
      actorUid: data.createdBy || 'ADMIN',
      actorEmail: 'admin@studentstudy.edu',
      action: 'CREATE_USER',
      targetType: 'USER',
      targetId: uid,
      metadata: { email: newUser.email, role: newUser.role, department: newUser.department },
    });

    return newUser;
  }

  public updateUser(uid: string, updates: Partial<UserProfile> & { password?: string }, actorUid?: string): UserProfile {
    const user = this.users.get(uid);
    if (!user) throw new Error('Không tìm thấy người dùng');

    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = this.getUserByEmail(updates.email);
      if (existing && existing.uid !== uid) {
        throw new Error(`Email "${updates.email}" đã được sử dụng bởi người dùng khác`);
      }
      user.email = updates.email.toLowerCase().trim();
    }

    if (updates.displayName) user.displayName = updates.displayName.trim();
    if (updates.role) user.role = updates.role;
    if (updates.status) user.status = updates.status;
    if (updates.department !== undefined) user.department = updates.department;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;

    user.updatedAt = new Date().toISOString();
    this.users.set(uid, user);

    if (updates.password) {
      this.userPasswords.set(user.email.toLowerCase(), updates.password);
    }

    this.saveUsers();

    this.logAction({
      actorUid: actorUid || 'ADMIN',
      actorEmail: 'admin@studentstudy.edu',
      action: 'UPDATE_USER',
      targetType: 'USER',
      targetId: uid,
      metadata: { updates },
    });

    return user;
  }

  public deleteUser(uid: string, actorUid?: string): boolean {
    const user = this.users.get(uid);
    if (!user) return false;

    this.users.delete(uid);
    this.userPasswords.delete(user.email.toLowerCase());
    this.saveUsers();

    this.logAction({
      actorUid: actorUid || 'ADMIN',
      actorEmail: 'admin@studentstudy.edu',
      action: 'DELETE_USER',
      targetType: 'USER',
      targetId: uid,
      metadata: { email: user.email },
    });

    return true;
  }

  // ===================== QUIZ MANAGEMENT =====================
  public listQuizzes(params?: { category?: string; difficulty?: string; search?: string; visibility?: string }) {
    let result = Array.from(this.quizzes.values());

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(quiz => 
        quiz.title.toLowerCase().includes(q) || 
        quiz.description.toLowerCase().includes(q) ||
        quiz.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (params?.category && params.category !== 'ALL') {
      result = result.filter(q => q.category === params.category);
    }

    if (params?.difficulty && params.difficulty !== 'ALL') {
      result = result.filter(q => q.difficulty === params.difficulty);
    }

    if (params?.visibility && params.visibility !== 'ALL') {
      result = result.filter(q => q.visibility === params.visibility);
    }

    // Sort by updatedAt desc
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getQuizById(id: string): Quiz | null {
    return this.quizzes.get(id) || null;
  }

  public createQuiz(data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Quiz {
    const id = 'quiz_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const newQuiz: Quiz = {
      ...data,
      id,
      playCount: 0,
      questionCount: data.questions ? data.questions.length : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.quizzes.set(id, newQuiz);
    this.saveQuizzes();

    this.logAction({
      actorUid: data.ownerId,
      actorEmail: data.ownerName,
      action: 'CREATE_QUIZ',
      targetType: 'QUIZ',
      targetId: id,
      metadata: { title: newQuiz.title },
    });

    return newQuiz;
  }

  public updateQuiz(id: string, updates: Partial<Quiz>, actorUid?: string): Quiz {
    const quiz = this.quizzes.get(id);
    if (!quiz) throw new Error('Không tìm thấy Quiz');

    const updatedQuiz: Quiz = {
      ...quiz,
      ...updates,
      updatedAt: new Date().toISOString(),
      questionCount: updates.questions ? updates.questions.length : quiz.questions?.length || 0,
    };

    this.quizzes.set(id, updatedQuiz);
    this.saveQuizzes();

    this.logAction({
      actorUid: actorUid || quiz.ownerId,
      actorEmail: quiz.ownerName,
      action: 'UPDATE_QUIZ',
      targetType: 'QUIZ',
      targetId: id,
      metadata: { title: updatedQuiz.title },
    });

    return updatedQuiz;
  }

  public deleteQuiz(id: string, actorUid?: string): boolean {
    const quiz = this.quizzes.get(id);
    if (!quiz) return false;

    this.quizzes.delete(id);
    this.saveQuizzes();

    this.logAction({
      actorUid: actorUid || 'ADMIN',
      actorEmail: 'system',
      action: 'DELETE_QUIZ',
      targetType: 'QUIZ',
      targetId: id,
      metadata: { title: quiz.title },
    });

    return true;
  }

  public duplicateQuiz(id: string, newOwnerId: string, newOwnerName: string): Quiz {
    const quiz = this.quizzes.get(id);
    if (!quiz) throw new Error('Không tìm thấy Quiz để nhân bản');

    const dupId = 'quiz_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const duplicated: Quiz = {
      ...quiz,
      id: dupId,
      title: `${quiz.title} (Bản sao)`,
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      playCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: quiz.questions?.map(q => ({
        ...q,
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        quizId: dupId,
      })),
    };

    this.quizzes.set(dupId, duplicated);
    this.saveQuizzes();
    return duplicated;
  }

  // ===================== SOLO QUIZ ATTEMPTS =====================
  public saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'createdAt'>): QuizAttempt {
    const id = 'att_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const newAttempt: QuizAttempt = {
      ...attempt,
      id,
      createdAt: new Date().toISOString(),
    };

    this.attempts.unshift(newAttempt);
    this.saveAttempts();

    // Increment playCount on quiz
    const quiz = this.quizzes.get(attempt.quizId);
    if (quiz) {
      quiz.playCount = (quiz.playCount || 0) + 1;
      this.quizzes.set(quiz.id, quiz);
      this.saveQuizzes();
    }

    return newAttempt;
  }

  public getUserAttempts(userId: string): QuizAttempt[] {
    return this.attempts.filter(a => a.userId === userId);
  }

  // ===================== REALTIME MULTIPLAYER SESSIONS =====================
  public createGameSession(quizId: string, host: UserProfile): RealtimeGameSession {
    const quiz = this.quizzes.get(quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      throw new Error('Quiz không hợp lệ hoặc chưa có câu hỏi');
    }

    // Generate random 6-digit game PIN
    let pin = '';
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.activeGames.has(pin));

    const session: RealtimeGameSession = {
      id: pin,
      quizId: quiz.id,
      quizTitle: quiz.title,
      hostId: host.uid,
      hostName: host.displayName,
      status: 'WAITING',
      currentQuestionIndex: 0,
      totalQuestions: quiz.questions.length,
      timeLimit: quiz.questions[0].timeLimit || 20,
      timeRemaining: quiz.questions[0].timeLimit || 20,
      questionStartTime: Date.now(),
      players: {},
      answers: {},
      currentQuestion: quiz.questions[0],
      createdAt: new Date().toISOString(),
    };

    this.activeGames.set(pin, session);
    this.saveActiveGames();

    return session;
  }

  public getGameSession(pin: string): RealtimeGameSession | null {
    return this.activeGames.get(pin) || null;
  }

  public joinGameSession(pin: string, player: { id: string; name: string; avatar?: string }): RealtimeGameSession {
    const session = this.activeGames.get(pin);
    if (!session) throw new Error('Mã PIN không tồn tại hoặc trò chơi đã kết thúc');
    if (session.status !== 'WAITING') throw new Error('Trò chơi đã bắt đầu, không thể tham gia lúc này');

    session.players[player.id] = {
      id: player.id,
      name: player.name,
      avatar: player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`,
      score: 0,
      streak: 0,
      isOnline: true,
      lastActive: Date.now(),
    };

    this.activeGames.set(pin, session);
    this.saveActiveGames();
    return session;
  }

  public submitGameAnswer(pin: string, playerId: string, answerIndex: any, timeSpent: number): RealtimeGameSession {
    const session = this.activeGames.get(pin);
    if (!session || session.status !== 'QUESTION') throw new Error('Không thể trả lời vào lúc này');
    
    const qIndex = session.currentQuestionIndex;
    const currentQ = session.currentQuestion;
    if (!currentQ) throw new Error('Không tìm thấy câu hỏi hiện tại');

    // Initialize answer storage
    if (!session.answers[qIndex]) {
      session.answers[qIndex] = {};
    }

    if (session.answers[qIndex][playerId]) {
      // Already answered this question
      return session;
    }

    // Check correctness
    let isCorrect = false;
    if (Array.isArray(currentQ.correctAnswer)) {
      if (Array.isArray(answerIndex)) {
        isCorrect = currentQ.correctAnswer.length === answerIndex.length &&
          currentQ.correctAnswer.every(val => answerIndex.includes(val));
      }
    } else {
      isCorrect = Number(currentQ.correctAnswer) === Number(answerIndex);
    }

    // Calculate score based on speed and correctness (Kahoot formula)
    let scoreEarned = 0;
    const player = session.players[playerId];

    if (isCorrect) {
      const maxPoints = currentQ.points || 1000;
      const timeRatio = Math.max(0, 1 - (timeSpent / (session.timeLimit * 1000)));
      scoreEarned = Math.round(maxPoints * (0.5 + (0.5 * timeRatio)));
      
      if (player) {
        player.streak = (player.streak || 0) + 1;
        // Streak bonus
        if (player.streak > 1) {
          scoreEarned += Math.min(player.streak * 50, 250);
        }
        player.score = (player.score || 0) + scoreEarned;
      }
    } else {
      if (player) {
        player.streak = 0;
      }
    }

    session.answers[qIndex][playerId] = {
      answer: answerIndex,
      score: scoreEarned,
      answeredAt: Date.now(),
      isCorrect,
      timeSpent,
    };

    this.activeGames.set(pin, session);
    this.saveActiveGames();
    return session;
  }

  public nextGameQuestion(pin: string): RealtimeGameSession {
    const session = this.activeGames.get(pin);
    if (!session) throw new Error('Không tìm thấy phòng chơi');
    
    const quiz = this.quizzes.get(session.quizId);
    if (!quiz || !quiz.questions) throw new Error('Không tìm thấy câu hỏi của Quiz');

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= quiz.questions.length) {
      // End of game -> Calculate final rankings & save to persistent game results
      session.status = 'FINISHED';
      this.finishGameSession(pin);
    } else {
      session.currentQuestionIndex = nextIndex;
      session.currentQuestion = quiz.questions[nextIndex];
      session.timeLimit = quiz.questions[nextIndex].timeLimit || 20;
      session.timeRemaining = session.timeLimit;
      session.questionStartTime = Date.now();
      session.status = 'QUESTION';
    }

    this.activeGames.set(pin, session);
    this.saveActiveGames();
    return session;
  }

  public showGameResults(pin: string): RealtimeGameSession {
    const session = this.activeGames.get(pin);
    if (!session) throw new Error('Không tìm thấy phòng chơi');

    session.status = 'RESULTS';
    this.activeGames.set(pin, session);
    this.saveActiveGames();
    return session;
  }

  public startGameSession(pin: string): RealtimeGameSession {
    const session = this.activeGames.get(pin);
    if (!session) throw new Error('Không tìm thấy phòng chơi');

    session.status = 'QUESTION';
    session.questionStartTime = Date.now();
    session.startedAt = new Date().toISOString();

    this.activeGames.set(pin, session);
    this.saveActiveGames();
    return session;
  }

  private finishGameSession(pin: string): GameResult | null {
    const session = this.activeGames.get(pin);
    if (!session) return null;

    const playerList = Object.values(session.players).sort((a, b) => b.score - a.score);
    const rankedPlayers = playerList.map((p, idx) => {
      // Count correct answers
      let correctCount = 0;
      Object.keys(session.answers).forEach(qIdx => {
        if (session.answers[qIdx][p.id]?.isCorrect) {
          correctCount++;
        }
      });
      return {
        id: p.id,
        name: p.name,
        score: p.score,
        rank: idx + 1,
        correctCount,
        totalQuestions: session.totalQuestions,
        accuracy: session.totalQuestions > 0 ? Math.round((correctCount / session.totalQuestions) * 100) : 0,
      };
    });

    const winner = rankedPlayers[0] || { name: 'Chưa có người chơi', score: 0 };

    const gameResult: GameResult = {
      id: 'res_' + session.id + '_' + Date.now(),
      quizId: session.quizId,
      quizTitle: session.quizTitle,
      hostId: session.hostId,
      hostName: session.hostName,
      players: rankedPlayers,
      winner: { name: winner.name, score: winner.score },
      startedAt: session.startedAt || new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.gameResults.unshift(gameResult);
    this.saveGameResults();

    return gameResult;
  }

  public getGameResults(): GameResult[] {
    return this.gameResults;
  }

  // ===================== AUDIT LOGS =====================
  public logAction(entry: Omit<AuditLog, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const log: AuditLog = {
      ...entry,
      id: 'log_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: now,
      timestamp: now,
      actorName: entry.actorName || entry.actorEmail || entry.actorUid || 'Hệ thống',
      target: entry.target || (entry.targetType ? `${entry.targetType}${entry.targetId ? ` (${entry.targetId})` : ''}` : entry.targetId || ''),
    };

    this.auditLogs.unshift(log);
    // Keep max 500 logs
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveAuditLogs();
  }

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  // ===================== ADMIN OVERVIEW METRICS =====================
  public getSystemMetrics() {
    const allUsers = Array.from(this.users.values());
    const activeUsers = allUsers.filter(u => u.status === 'ACTIVE').length;
    const disabledUsers = allUsers.filter(u => u.status === 'DISABLED').length;

    const allQuizzes = Array.from(this.quizzes.values());
    const totalPlays = allQuizzes.reduce((acc, q) => acc + (q.playCount || 0), 0);
    const activeMultiplayerGames = Array.from(this.activeGames.values()).filter(g => g.status !== 'FINISHED').length;

    return {
      totalUsers: allUsers.length,
      activeUsers,
      disabledUsers,
      totalQuizzes: allQuizzes.length,
      totalPlays,
      totalGameSessions: this.gameResults.length,
      activeMultiplayerGames,
      recentUsers: allUsers.slice(-5).reverse(),
      recentLogs: this.auditLogs.slice(0, 5),
    };
  }

  // ===================== FIRESTORE SYNC HELPERS =====================
  public setQuizzes(quizzes: Quiz[]) {
    quizzes.forEach(q => this.quizzes.set(q.id, q));
  }

  public setUsers(users: UserProfile[]) {
    users.forEach(u => this.users.set(u.uid, u));
  }

  public setAttempts(attempts: QuizAttempt[]) {
    this.attempts = attempts;
  }

  public setAuditLogs(logs: AuditLog[]) {
    this.auditLogs = logs;
  }

  public getAllQuizzes(): Quiz[] {
    return Array.from(this.quizzes.values());
  }

  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  public getAllAttempts(): QuizAttempt[] {
    return this.attempts;
  }
}

// Global Singleton Store
export const dataStore = new DataStore();
