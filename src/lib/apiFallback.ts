import { dataStore } from './db/store';

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
      const res = dataStore.authenticate(email, password);
      if (!res) {
        return makeJsonResponse({
          success: false,
          error: { message: 'Email hoặc mật khẩu không chính xác' },
        }, 401);
      }
      return makeJsonResponse({
        success: true,
        data: {
          user: res.user,
          token: 'token_' + res.user.uid + '_' + Date.now(),
        },
      });
    } catch (err: any) {
      return makeJsonResponse({
        success: false,
        error: { message: err.message || 'Đăng nhập không thành công' },
      }, 403);
    }
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

    const quizzes = dataStore.listQuizzes({ category, difficulty, search, visibility });
    return makeJsonResponse({ success: true, data: quizzes });
  }

  if (path === '/api/quizzes' && method === 'POST') {
    try {
      const quiz = dataStore.createQuiz(body);
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
    const quiz = dataStore.getQuizById(id);
    if (!quiz) {
      return makeJsonResponse({ success: false, error: { message: 'Quiz not found' } }, 404);
    }
    return makeJsonResponse({ success: true, data: quiz });
  }

  if (path.startsWith('/api/quizzes/') && (method === 'PUT' || method === 'PATCH')) {
    const id = path.split('/')[3];
    try {
      const updated = dataStore.updateQuiz(id, body);
      return makeJsonResponse({ success: true, data: updated });
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/quizzes/') && method === 'DELETE') {
    const id = path.split('/')[3];
    dataStore.deleteQuiz(id);
    return makeJsonResponse({ success: true });
  }

  if (path === '/api/quizzes/attempt' && method === 'POST') {
    const saved = dataStore.saveQuizAttempt(body);
    return makeJsonResponse({ success: true, data: saved });
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
    const result = dataStore.listUsers({ search, role, status });
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
      const user = dataStore.createUser(body);
      return makeJsonResponse({ success: true, data: user }, 201);
    } catch (e: any) {
      return makeJsonResponse({ success: false, error: { message: e.message } }, 400);
    }
  }

  if (path.startsWith('/api/admin/users/') && path.endsWith('/status') && (method === 'PATCH' || method === 'PUT')) {
    const id = path.split('/')[4];
    const user = dataStore.updateUser(id, { status: body.status });
    return makeJsonResponse({ success: true, data: user });
  }

  if (path.startsWith('/api/admin/users/') && path.endsWith('/role') && (method === 'PATCH' || method === 'PUT')) {
    const id = path.split('/')[4];
    const user = dataStore.updateUser(id, { role: body.role });
    return makeJsonResponse({ success: true, data: user });
  }

  if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
    const id = path.split('/')[4];
    dataStore.deleteUser(id);
    return makeJsonResponse({ success: true });
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
      const session = dataStore.startGameRoom(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/answer') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      const res = dataStore.submitRoomAnswer(id, body.playerId, body.answer, body.timeSpent || 0);
      return makeJsonResponse({ success: true, data: res });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/next') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      const session = dataStore.nextRoomQuestion(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && path.endsWith('/end') && method === 'POST') {
    const id = path.split('/')[3];
    try {
      const session = dataStore.endOrExpireGameRoom(id);
      return makeJsonResponse({ success: true, data: session, session });
    } catch (err: any) {
      return makeJsonResponse({ success: false, error: { message: err.message } }, 400);
    }
  }

  if (path.startsWith('/api/game/') && method === 'GET') {
    const id = path.split('/')[3];
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

        // If response is valid JSON, return it
        if (response.ok && contentType.includes('application/json')) {
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
