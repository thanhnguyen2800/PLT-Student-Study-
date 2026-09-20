import { dataStore } from './db/store';
import { getClientFirestore, isFirebaseConfigured } from './firebase/client';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { GameSession, Player, Quiz, UserProfile, UserRole } from '../types';
import { parseCSV } from '../utils/csv';

function removeUndefined(value: any): any {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefined(item)]));
  }
  return value;
}

async function getFirebaseQuizzes(): Promise<Quiz[]> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDocs(collection(db, 'quizzes'));
  return snapshot.docs.map(item => item.data() as Quiz).filter(quiz => Boolean(quiz.id));
}

async function getFirebaseQuiz(id: string): Promise<Quiz | null> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDoc(doc(db, 'quizzes', id));
  return snapshot.exists() ? snapshot.data() as Quiz : null;
}

async function saveFirebaseQuiz(quiz: Quiz): Promise<Quiz> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  await setDoc(doc(db, 'quizzes', quiz.id), removeUndefined(quiz), { merge: true });
  return quiz;
}

async function getFirebaseUserByEmail(email: string): Promise<UserProfile | null> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDocs(collection(db, 'users'));
  const target = email.toLowerCase().trim();
  const user = snapshot.docs
    .map(item => item.data() as UserProfile)
    .find(item => item.email?.toLowerCase().trim() === target);
  return user || null;
}

async function getFirebaseUsers(): Promise<UserProfile[]> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map(item => item.data() as UserProfile)
    .filter(user => Boolean(user.uid && user.email));
}

async function getFirebaseUserById(uid: string): Promise<UserProfile | null> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() as UserProfile : null;
}

async function saveFirebaseUser(user: UserProfile): Promise<UserProfile> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  await setDoc(doc(db, 'users', user.uid), removeUndefined({
    ...user,
    syncedAt: new Date().toISOString(),
  }), { merge: true });
  return user;
}

async function createFallbackUser(body: any): Promise<UserProfile> {
  const email = String(body.email || '').toLowerCase().trim();
  if (isFirebaseConfigured()) {
    const cloudUser = await getFirebaseUserByEmail(email);
    if (cloudUser) {
      throw new Error(`Email "${email}" đã tồn tại trên hệ thống Firebase`);
    }
    const stale = dataStore.getUserByEmail(email);
    if (stale) dataStore.deleteUser(stale.uid);
  } else {
    const local = dataStore.getUserByEmail(email);
    if (local) {
      throw new Error(`Email "${email}" đã tồn tại trên hệ thống`);
    }
  }

  const user = dataStore.createUser({ ...body, email }, { ignoreExistingEmail: true });
  try {
    if (isFirebaseConfigured()) {
      user.passwordHash = await hashPassword(String(body.password || 'Student@123'));
      await saveFirebaseUser(user);
    }
    return user;
  } catch (error) {
    dataStore.deleteUser(user.uid);
    throw error;
  }
}

async function getFirebaseGameSession(id: string): Promise<GameSession | null> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  const snapshot = await getDoc(doc(db, 'gameSessions', id));
  return snapshot.exists() ? snapshot.data() as GameSession : null;
}

async function saveFirebaseGameSession(session: GameSession): Promise<GameSession> {
  const db = getClientFirestore();
  if (!db) throw new Error('Firebase chưa được cấu hình cho ứng dụng này');
  await setDoc(doc(db, 'gameSessions', session.id), removeUndefined({
    ...session,
    pin: session.pin || session.id,
    updatedAt: new Date().toISOString(),
  }), { merge: true });
  return session;
}

// Helper to create a fake JSON Response
function makeJsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseJsonBody(init?: RequestInit): any {
  if (!init || !init.body) return {};
  try {
    if (typeof init.body === 'string') {
      return JSON.parse(init.body);
    }
    return {};
  } catch {
    return {};
  }
}

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Client-Side API Router: handles /api/* requests when backend server is not available
 * (such as in static Vercel, Netlify, or offline deployments).
 */
export async function handleClientApi(urlStr: string, init?: RequestInit): Promise<Response | null> {
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body = parseJsonBody(init);

  // 1. Authentication
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = body;
      const res = isFirebaseConfigured() ? null : dataStore.authenticate(email, password);
      if (res) {
        return makeJsonResponse({
          success: true,
          data: { user: res.user, token: 'token_' + res.user.uid + '_' + Date.now() },
        });
      }

      if (isFirebaseConfigured()) {
        const user = await getFirebaseUserByEmail(email);
        const suppliedPassword = String(password || '').trim();
        const passwordHash = await hashPassword(suppliedPassword);
        const legacyPasswords = ['Admin@123', 'Student@123', 'Teacher@123', 'admin123', 'teacher123', 'student123', '123456', 'password'];
        const validPassword = user && user.status !== 'DISABLED' && user.status !== 'LOCKED' &&
          ((user.passwordHash && user.passwordHash === passwordHash) ||
            (!user.passwordHash && legacyPasswords.includes(suppliedPassword)));

        if (validPassword && user) {
          user.lastLoginAt = new Date().toISOString();
          await saveFirebaseUser(user);
          return makeJsonResponse({
            success: true,
            data: { user, token: 'token_' + user.uid + '_' + Date.now() },
          });
        }
      }

      return makeJsonResponse({
        success: false,
        error: { message: 'Email hoặc mật khẩu không chính xác' },
      }, 401);
    } catch (err: any) {
      return makeJsonResponse({
        success: false,
        error: { message: err.message || 'Đăng nhập không thành công' },
      }, 403);
    }
  }

  if (path === '/api/auth/session' && method === 'GET') {
    const authorization = String(init?.headers && new Headers(init.headers).get('Authorization') || '');
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const uid = token.match(/^token_([^_]+)(?:_\d+)?$/)?.[1];
    const user = uid
      ? (isFirebaseConfigured() ? await getFirebaseUserById(uid) : dataStore.getUserById(uid))
      : null;
    if (!user || user.status === 'DISABLED' || user.status === 'LOCKED') {
      return makeJsonResponse({ success: false, error: { message: 'Tài khoản không còn hoạt động' } }, 401);
    }
    return makeJsonResponse({ success: true, data: { user } });
  }

  // 2. Health & Status
  if (path === '/api/health' || path === '/api/firebase/status') {
    return makeJsonResponse({
      success: true,
      status: 'ok',
      clientFallback: true,
      ready: true,
      message: 'STUDENT STUDY Offline/Client Datastore Ready',
    });
  }

  // 3. Quizzes
  if (path === '/api/quizzes' && method === 'GET') {
    const category = url.searchParams.get('category') || undefined;
    const difficulty = url.searchParams.get('difficulty') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const visibility = url.searchParams.get('visibility') || undefined;

    try {
      const quizzes = isFirebaseConfigured()
        ? await getFirebaseQuizzes()
        : dataStore.listQuizzes({ category, difficulty, search, visibility });
      const filtered = quizzes.filter(quiz =>
        (!category || quiz.category === category) &&
        (!difficulty || quiz.difficulty === difficulty) &&
        (!visibility || quiz.visibility === visibility) &&
        (!search || `${quiz.title} ${quiz.description} ${quiz.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return makeJsonResponse({ success: true, data: filtered });
    } catch (error: any) {
      return makeJsonResponse({ success: false, error: { message: error.message || 'Không thể đọc dữ liệu Firebase' } }, 500);
    }
  }

  if (path === '/api/quizzes' && method === 'POST') {
    try {
      const quiz = dataStore.createQuiz(body);
      if (isFirebaseConfigured()) await saveFirebaseQuiz(quiz);
      return makeJsonResponse({ success: true, data: quiz }, 201);
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/quizzes/') && path.endsWith('/duplicate') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      const dup = dataStore.duplicateQuiz(id, body.ownerId || 'user-teacher-01', body.ownerName || 'Giảng viên');
      return makeJsonResponse({ success: true, data: dup });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/quizzes/') && method === 'GET') {
    const id = path.split('/')[3];
    const quiz = isFirebaseConfigured() ? await getFirebaseQuiz(id) : dataStore.getQuizById(id);
    if (!quiz) {
      return makeJsonResponse({ success: false, error: { message: 'Quiz not found' } }, 404);
    }
    return makeJsonResponse({ success: true, data: quiz });
  }

  if (path.startsWith('/api/quizzes/') && (method === 'PUT' || method === 'PATCH')) {
    const id = path.split('/')[3];
    try {
      const current = isFirebaseConfigured() ? await getFirebaseQuiz(id) : dataStore.getQuizById(id);
      if (!current) return makeJsonResponse({ success: false, error: { message: 'Quiz not found' } }, 404);
      const updated = { ...current, ...body, id, updatedAt: new Date().toISOString(), questionCount: body.questions?.length ?? current.questionCount } as Quiz;
      if (isFirebaseConfigured()) await saveFirebaseQuiz(updated);
      else dataStore.updateQuiz(id, body);
      return makeJsonResponse({ success: true, data: updated });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/quizzes/') && method === 'DELETE') {
    const id = path.split('/')[3];
    if (isFirebaseConfigured()) {
      const db = getClientFirestore();
      if (!db) return makeJsonResponse({ success: false, error: { message: 'Firebase chưa được cấu hình' } }, 500);
      await deleteDoc(doc(db, 'quizzes', id));
    } else {
      dataStore.deleteQuiz(id);
    }
    return makeJsonResponse({ success: true });
  }

  if (path === '/api/quizzes/attempt' && method === 'POST') {
    const saved = dataStore.saveQuizAttempt(body);
    return makeJsonResponse({ success: true, data: saved });
  }

  if (path.startsWith('/api/quizzes/attempts') && method === 'GET') {
    const userId = url.searchParams.get('userId');
    const attempts = userId ? dataStore.getUserAttempts(userId) : dataStore.getAllAttempts();
    return makeJsonResponse({ success: true, data: attempts });
  }

  // 4. Admin Users & Stats
  if (path === '/api/admin/stats' && method === 'GET') {
    const metrics = dataStore.getSystemMetrics();
    return makeJsonResponse({ success: true, data: metrics });
  }

  if (path === '/api/admin/users' && method === 'GET') {
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') || undefined;
    const status = url.searchParams.get('status') || undefined;
    let result = dataStore.listUsers({ search, role, status });
    if (isFirebaseConfigured()) {
      try {
        const cloudUsers = await getFirebaseUsers();
        let users = cloudUsers;
        const queryText = search?.toLowerCase() || '';
        users = users.filter(user =>
          (!queryText || user.displayName.toLowerCase().includes(queryText) || user.email.toLowerCase().includes(queryText) || (user.department || '').toLowerCase().includes(queryText)) &&
          (!role || role === 'ALL' || user.role === role) &&
          (!status || status === 'ALL' || user.status === status)
        );
        users.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
        result = { users, total: users.length, page: 1, totalPages: 1 };
      } catch (error) {
        if (isFirebaseConfigured()) {
          return makeJsonResponse({ success: false, error: { message: 'Không thể đọc danh sách tài khoản từ Firebase' } }, 503);
        }
        console.warn('[Client API] Không thể đọc users từ Firestore, dùng dữ liệu cục bộ:', error);
      }
    }
    return makeJsonResponse({
      success: true,
      data: result.users,
      users: result.users,
      total: result.total,
      page: 1,
      totalPages: 1,
    });
  }

  if (path === '/api/admin/users' && method === 'POST') {
    try {
      const user = await createFallbackUser(body);
      return makeJsonResponse({ success: true, data: user }, 201);
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path === '/api/admin/users/import-csv' && method === 'POST') {
    try {
      const csvContent = body.csvContent || body.csvString;
      if (!csvContent) throw new Error('Vui lòng cung cấp nội dung file CSV hợp lệ');
      const { validRows, invalidRows, totalRows } = parseCSV(csvContent);
      const errors = invalidRows.map(item => ({ line: item.line, email: 'N/A', message: item.errors.join('; ') }));
      let created = 0;

      for (const row of validRows) {
        try {
          if (row.action !== 'CREATE') {
            throw new Error('Bản nhập CSV trên môi trường này chỉ hỗ trợ action CREATE');
          }
          await createFallbackUser({
            email: row.email,
            displayName: row.displayName || row.email.split('@')[0],
            password: row.password || 'Student@123',
            role: (row.role as UserRole) || 'PLAYER',
            status: row.status || 'ACTIVE',
            department: row.department,
            phone: row.phone,
            createdBy: body.actorName || body.actorId || 'ADMIN',
          });
          created++;
        } catch (error: any) {
          errors.push({ line: row.line, email: row.email, message: error.message || 'Lỗi xử lý dòng dữ liệu' });
        }
      }

      return makeJsonResponse({
        success: true,
        data: { total: totalRows, success: created, failed: errors.length, created, updated: 0, deleted: 0, imported: created, errors },
      });
    } catch (error: any) {
      return makeJsonResponse({ success: false, error: { message: error.message } }, 400);
    }
  }

  if (path.startsWith('/api/admin/users/') && path.endsWith('/status') && (method === 'PATCH' || method === 'PUT')) {
    const id = path.split('/')[4];
    try {
      let target = dataStore.getUserById(id);
      if (!target && isFirebaseConfigured()) {
        target = await getFirebaseUserById(id);
      }
      if (!target) return makeJsonResponse({ success: false, error: { message: 'Không tìm thấy người dùng' } }, 404);

      const updated: UserProfile = dataStore.getUserById(id)
        ? dataStore.updateUser(id, { status: body.status }, body.actorId)
        : { ...target, status: body.status, updatedAt: new Date().toISOString() };

      if (isFirebaseConfigured()) {
        await saveFirebaseUser(updated);
      }
      return makeJsonResponse({ success: true, data: updated });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/admin/users/') && path.endsWith('/role') && (method === 'PATCH' || method === 'PUT')) {
    const id = path.split('/')[4];
    try {
      let target = dataStore.getUserById(id);
      if (!target && isFirebaseConfigured()) {
        target = await getFirebaseUserById(id);
      }
      if (!target) return makeJsonResponse({ success: false, error: { message: 'Không tìm thấy người dùng' } }, 404);

      const updated: UserProfile = dataStore.getUserById(id)
        ? dataStore.updateUser(id, { role: body.role }, body.actorId)
        : { ...target, role: body.role, updatedAt: new Date().toISOString() };

      if (isFirebaseConfigured()) {
        await saveFirebaseUser(updated);
      }
      return makeJsonResponse({ success: true, data: updated });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
    const id = path.split('/')[4];
    try {
      const localTarget = dataStore.getUserById(id);
      const target = localTarget || (isFirebaseConfigured() ? await getFirebaseUserById(id) : null);
      if (!target) {
        return makeJsonResponse({ success: false, error: { message: 'Không tìm thấy người dùng' } }, 404);
      }
      if (isFirebaseConfigured()) {
        const db = getClientFirestore();
        if (db) {
          await deleteDoc(doc(db, 'users', id));
          if (target.email) {
            const snap = await getDocs(collection(db, 'users'));
            for (const d of snap.docs) {
              if (d.data().email?.toLowerCase() === target.email.toLowerCase()) {
                await deleteDoc(d.ref);
              }
            }
          }
        }
      }
      dataStore.deleteUser(id, body.actorId);
      return makeJsonResponse({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path === '/api/admin/audit-logs' && method === 'GET') {
    const logs = dataStore.getAuditLogs(100);
    return makeJsonResponse({ success: true, data: logs });
  }

  // 5. Game sessions / Kahoot rooms
  if (path === '/api/game/create' && method === 'POST') {
    try {
      const hostData = {
        uid: body.hostId || body.host?.uid || 'host_teacher',
        displayName: body.hostName || body.host?.displayName || 'ThS. Trần Văn Minh',
      };
      if (isFirebaseConfigured()) {
        const quiz = await getFirebaseQuiz(body.quizId);
        if (!quiz || !quiz.questions?.length) {
          return makeJsonResponse({ success: false, error: { message: 'Quiz không tồn tại hoặc chưa có câu hỏi để tạo phòng' } }, 400);
        }
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date().toISOString();
        const session: GameSession = {
          id: pin,
          pin,
          quizId: quiz.id,
          quizTitle: quiz.title,
          hostId: hostData.uid,
          hostName: hostData.displayName,
          status: 'WAITING',
          currentQuestionIndex: 0,
          totalQuestions: quiz.questions.length,
          players: [],
          answers: {},
          createdAt: now,
          updatedAt: now,
          isExpired: false,
          questions: quiz.questions,
          currentQuestion: quiz.questions[0],
        };
        await saveFirebaseGameSession(session);
        return makeJsonResponse({ success: true, data: { session, quiz }, session, quiz }, 201);
      }
      const res = dataStore.createGameRoom(body.quizId, hostData);
      return makeJsonResponse({
        success: true,
        data: {
          session: res.session,
          quiz: res.quiz,
        },
        session: res.session,
        quiz: res.quiz,
      });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message || 'Không thể tạo phòng' } }, 400);
    }
  }

  if (path === '/api/game/join' && method === 'POST') {
    try {
      const pin = body.pin || '';
      const playerName = body.name || body.playerName || body.player?.name || 'Thí sinh';
      const playerAvatar = body.avatar || body.playerAvatar || body.player?.avatar;
      if (isFirebaseConfigured()) {
        const session = await getFirebaseGameSession(String(pin).trim());
        if (!session || session.isExpired || session.status !== 'WAITING') {
          return makeJsonResponse({ success: false, error: { message: 'Mã PIN không tồn tại hoặc phòng thi đã kết thúc / hết hiệu lực' } }, 400);
        }
        const cleanName = String(playerName).trim() || 'Thí sinh';
        const player: Player = {
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: cleanName,
          avatar: playerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
          score: 0,
          streak: 0,
        };
        const players = [...(session.players || [])];
        const existingIndex = players.findIndex(item => item.name.trim().toLowerCase() === cleanName.toLowerCase());
        if (existingIndex >= 0) players[existingIndex] = player;
        else players.push(player);
        const updatedSession = await saveFirebaseGameSession({ ...session, players });
        const quiz = await getFirebaseQuiz(updatedSession.quizId);
        return makeJsonResponse({ success: true, data: { session: updatedSession, player, quiz }, session: updatedSession, player, quiz });
      }
      const res = dataStore.joinGameRoom(pin, { name: playerName, avatar: playerAvatar });
      const quiz = dataStore.getQuizById(res.session.quizId) || (res.session.questions ? {
        id: res.session.quizId,
        title: res.session.quizTitle,
        description: '',
        ownerId: res.session.hostId,
        ownerName: res.session.hostName,
        category: 'Chung',
        tags: [],
        difficulty: 'MEDIUM',
        coverImageUrl: '',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        playCount: 0,
        questionCount: res.session.questions.length,
        createdAt: res.session.createdAt,
        updatedAt: res.session.updatedAt,
        questions: res.session.questions,
      } : null);

      return makeJsonResponse({
        success: true,
        data: {
          session: res.session,
          player: res.player,
          quiz: quiz,
        },
        session: res.session,
        player: res.player,
        quiz: quiz,
      });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message || 'Không thể tham gia phòng thi' } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/start') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      if (isFirebaseConfigured()) {
        const session = await getFirebaseGameSession(id);
        if (!session || session.isExpired) throw new Error('Không tìm thấy phòng thi đấu hoặc phòng đã hết hiệu lực');
        const updated = await saveFirebaseGameSession({
          ...session,
          status: 'QUESTION_ACTIVE',
          currentQuestionIndex: 0,
          currentQuestion: session.questions?.[0] || session.currentQuestion,
        });
        return makeJsonResponse({ success: true, data: updated, session: updated });
      }
      const session = dataStore.startGameRoom(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/answer') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      if (isFirebaseConfigured()) {
        const session = await getFirebaseGameSession(id);
        const question = session?.questions?.[session.currentQuestionIndex] || session?.currentQuestion;
        if (!session || !question) throw new Error('Không tìm thấy câu hỏi hiện tại');
        const player = session.players.find(item => item.id === body.playerId);
        if (!player) throw new Error('Không tìm thấy người chơi trong phòng');
        const answerKey = question.id || `q_${session.currentQuestionIndex}`;
        const answers = { ...(session.answers || {}) };
        const questionAnswers = { ...(answers[answerKey] || {}) };
        if (!questionAnswers[player.id]) {
          const answer = body.answer ?? body.answerIndex;
          const isCorrect = Array.isArray(question.correctAnswer)
            ? Array.isArray(answer) && question.correctAnswer.length === answer.length && question.correctAnswer.every(value => answer.includes(value))
            : Number(question.correctAnswer) === Number(answer);
          const points = isCorrect ? question.points || 1000 : 0;
          if (isCorrect) player.score = (player.score || 0) + points;
          questionAnswers[player.id] = { answer, isCorrect, pointsEarned: points, score: points, answeredAt: Date.now() };
        }
        answers[answerKey] = questionAnswers;
        const updated = await saveFirebaseGameSession({ ...session, players: [...session.players], answers });
        const result = questionAnswers[player.id];
        return makeJsonResponse({ success: true, data: { isCorrect: result.isCorrect, points: result.pointsEarned || result.score || 0, session: updated } });
      }
      const res = dataStore.submitRoomAnswer(id, body.playerId, body.answer, body.timeSpent || 0);
      return makeJsonResponse({ success: true, data: res });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/next') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      if (isFirebaseConfigured()) {
        const session = await getFirebaseGameSession(id);
        if (!session) throw new Error('Không tìm thấy phòng thi đấu');
        const showingLeaderboard = session.status === 'QUESTION_ACTIVE';
        const nextIndex = session.currentQuestionIndex + 1;
        const finished = !showingLeaderboard && nextIndex >= session.totalQuestions;
        const updated = await saveFirebaseGameSession({
          ...session,
          status: finished ? 'FINISHED' : showingLeaderboard ? 'LEADERBOARD' : 'QUESTION_ACTIVE',
          currentQuestionIndex: showingLeaderboard ? session.currentQuestionIndex : nextIndex,
          currentQuestion: finished ? undefined : showingLeaderboard ? session.currentQuestion : session.questions?.[nextIndex],
          isExpired: finished,
        });
        return makeJsonResponse({ success: true, data: updated, session: updated });
      }
      const session = dataStore.nextRoomQuestion(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/end') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      if (isFirebaseConfigured()) {
        const session = await getFirebaseGameSession(id);
        if (!session) return makeJsonResponse({ success: true, data: null, session: null });
        const updated = await saveFirebaseGameSession({ ...session, status: 'FINISHED', isExpired: true });
        return makeJsonResponse({ success: true, data: updated, session: updated });
      }
      const session = dataStore.endOrExpireGameRoom(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && method === 'GET') {
    const id = path.split('/')[3];
    if (isFirebaseConfigured()) {
      const session = await getFirebaseGameSession(id);
      if (!session) {
        return makeJsonResponse({ success: false, error: { message: 'Phòng thi không tồn tại' } }, 404);
      }
      const quiz = await getFirebaseQuiz(session.quizId);
      return makeJsonResponse({
        success: true,
        data: { ...session, quiz, questions: session.questions || quiz?.questions, currentQuestion: session.currentQuestion || quiz?.questions?.[session.currentQuestionIndex] },
        session,
      });
    }
    const session = dataStore.getGameRoom(id);
    if (!session) {
      return makeJsonResponse({ success: false, error: { message: 'Phòng thi không tồn tại' } }, 404);
    }
    return makeJsonResponse({ success: true, data: session, session });
  }

  return null;
}

/**
 * Initializes global fetch interception.
 * If backend responds with non-JSON or fails (like static Vercel rewrite to index.html),
 * it automatically serves from local client dataStore.
 */
export function setupClientApiInterceptor() {
  if (typeof window === 'undefined') return;

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!originalFetch) return;

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Only intercept /api/*
      const isApi = urlStr.startsWith('/api/') || (urlStr.includes('/api/') && urlStr.startsWith(window.location.origin));
      if (!isApi) {
        return originalFetch(input, init);
      }

      try {
        const response = await originalFetch(input, init);
        const contentType = response.headers.get('content-type') || '';

        // If response is valid JSON from backend, return it directly
        if (contentType.includes('application/json')) {
          return response;
        }

        // If server returned HTML (Vercel SPA rewrite) or 404/500, attempt client-side fallback
        if (contentType.includes('text/html') || response.status === 404 || response.status === 500) {
          const fallbackRes = await handleClientApi(urlStr, init);
          if (fallbackRes) {
            return fallbackRes;
          }
        }

        return response;
      } catch {
        // Network error / offline / server not running: fallback to client dataStore
        const fallbackRes = await handleClientApi(urlStr, init);
        if (fallbackRes) {
          return fallbackRes;
        }
        throw new Error('Network error and no client API route handled ' + urlStr);
      }
    };

    // Safely assign without throwing TypeError on getter-only window properties
    let setSuccess = false;
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
      setSuccess = true;
    } catch {
      // Ignored, try prototype
    }

    if (!setSuccess) {
      try {
        const proto = Object.getPrototypeOf(window);
        if (proto) {
          Object.defineProperty(proto, 'fetch', {
            value: customFetch,
            writable: true,
            configurable: true,
          });
          setSuccess = true;
        }
      } catch {
        // Ignored
      }
    }

    if (!setSuccess) {
      try {
        (window as any).fetch = customFetch;
      } catch {
        // Silently pass if sandbox forbids overriding fetch
      }
    }
  } catch (err) {
    console.warn('API interceptor initialization skipped:', err);
  }
}
