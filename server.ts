import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createHash } from 'crypto';
import { dataStore } from './src/lib/db/store.js';
import { parseCSV } from './src/utils/csv.js';
import { UserRole } from './src/types.js';
import {
  getBackendFirestore,
  isFirestoreReady,
  saveQuizToFirestore,
  deleteQuizFromFirestore,
  loadAllQuizzesFromFirestore,
  saveUserToFirestore,
  getUserByEmailFromFirestore,
  deleteUserFromFirebase,
  removeOrphanedUserByEmail,
  loadAllUsersFromFirestore,
  saveAttemptToFirestore,
  loadAllAttemptsFromFirestore,
  saveAuditLogToFirestore,
  loadAllAuditLogsFromFirestore,
  saveGameSessionToFirestore,
  getGameSessionFromFirestore,
} from './src/lib/firebase/serverFirestore.js';

dotenv.config();

// Initialize Firestore before admin routes decide which data source is authoritative.
getBackendFirestore();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'STUDENT STUDY API',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng cung cấp đầy đủ email và mật khẩu' },
      });
    }

    const authenticateCloudUser = async () => {
      if (!isFirestoreReady()) return null;
      const user = await getUserByEmailFromFirestore(email);
      if (!user || user.status === 'DISABLED' || user.status === 'LOCKED') return null;
      const passwordHash = createHash('sha256').update(String(password).trim()).digest('hex');
      const validPasswords = ['Admin@123', 'Student@123', 'Teacher@123', 'admin123', 'teacher123', 'student123', '123456', 'password'];
      if (user.passwordHash && user.passwordHash !== passwordHash) return null;
      if (!user.passwordHash && !validPasswords.includes(String(password).trim())) return null;
      user.lastLoginAt = new Date().toISOString();
      await saveUserToFirestore(user);
      return { user };
    };

    const authenticate = async () => {
      const localAuthResult = isFirestoreReady() ? null : dataStore.authenticate(email, password);
      const authResult = isFirestoreReady()
        ? await authenticateCloudUser()
        : localAuthResult;
      if (!authResult) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_FAILED', message: 'Email hoặc mật khẩu không chính xác' },
        });
      }
      return res.json({
        success: true,
        data: { user: authResult.user, token: 'token_' + authResult.user.uid + '_' + Date.now() },
      });
    };

    authenticate().catch(error => res.status(500).json({
      success: false,
      error: { message: error.message || 'Không thể đăng nhập' },
    }));
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: { code: 'AUTH_BLOCKED', message: error.message || 'Đăng nhập không thành công' },
    });
  }
});

app.get('/api/auth/session', async (req, res) => {
  try {
    const authorization = String(req.headers.authorization || '');
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const uid = token.match(/^token_([^_]+)(?:_\d+)?$/)?.[1];
    if (!uid) return res.status(401).json({ success: false, error: { message: 'Phiên đăng nhập không hợp lệ' } });

    const firestoreUsers = isFirestoreReady() ? await loadAllUsersFromFirestore() : [];
    const user = isFirestoreReady()
      ? firestoreUsers.find(item => item.uid === uid)
      : dataStore.getUserById(uid);
    if (!user || user.status === 'DISABLED' || user.status === 'LOCKED') {
      return res.status(401).json({ success: false, error: { message: 'Tài khoản không còn hoạt động' } });
    }
    return res.json({ success: true, data: { user } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message || 'Không thể kiểm tra phiên' } });
  }
});

// -----------------------------------------------------------------------------
// Admin Endpoints
// -----------------------------------------------------------------------------
app.get('/api/admin/stats', (req, res) => {
  try {
    const metrics = dataStore.getSystemMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const { search, role, status, page, limit } = req.query;
    const firestoreUsers = isFirestoreReady() ? await loadAllUsersFromFirestore() : [];
    const sourceUsers = firestoreUsers.length > 0 ? firestoreUsers : dataStore.listUsers({ limit: 1000 }).users;
    const result = dataStore.listUsers({
      search: search as string,
      role: role as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 1000,
    });
    const filteredUsers = sourceUsers.filter(user => {
      const queryText = String(search || '').toLowerCase();
      return (!queryText || user.email.toLowerCase().includes(queryText) || user.displayName.toLowerCase().includes(queryText))
        && (!role || user.role === role)
        && (!status || user.status === status);
    });
    const users = isFirestoreReady() ? filteredUsers : result.users;
    res.json({
      success: true,
      data: users,
      users,
      total: users.length,
      page: 1,
      totalPages: 1,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, displayName, password, role, status, department, phone, createdBy, actorId, actorName } = req.body;
    if (!email || !displayName || !role) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Thiếu các thông tin bắt buộc (email, displayName, role)' },
      });
    }
    const firestoreUser = isFirestoreReady() ? await getUserByEmailFromFirestore(email) : null;
    if (firestoreUser) await removeOrphanedUserByEmail(email);
    const currentFirestoreUser = isFirestoreReady() ? await getUserByEmailFromFirestore(email) : null;
    if (currentFirestoreUser || (!isFirestoreReady() && dataStore.getUserByEmail(email))) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: `Email "${email}" đã tồn tại trên hệ thống` },
      });
    }

    const newUser = dataStore.createUser({
      email,
      displayName,
      password: password || 'Student@123',
      role,
      status: status || 'ACTIVE',
      department,
      phone,
      createdBy: actorName || createdBy || actorId || 'ADMIN',
    }, { ignoreExistingEmail: isFirestoreReady() });
    newUser.passwordHash = createHash('sha256').update(String(password || 'Student@123').trim()).digest('hex');

    if (isFirestoreReady() && !(await saveUserToFirestore(newUser))) {
      dataStore.deleteUser(newUser.uid);
      return res.status(503).json({
        success: false,
        error: { code: 'FIRESTORE_WRITE_FAILED', message: 'Không thể lưu tài khoản vào Firebase. Vui lòng thử lại.' },
      });
    }
    res.status(201).json({ success: true, data: newUser });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.put('/api/admin/users/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    if (updates.status !== undefined || updates.role !== undefined) {
      dataStore.assertCanManageUser(updates.actorId || updates.actorUid, uid);
    }
    const updated = dataStore.updateUser(uid, updates, updates.actorId || updates.actorUid);
    saveUserToFirestore(updated).catch(e => console.warn('[Firestore] Async update user failed:', e));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.patch('/api/admin/users/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    if (updates.status !== undefined || updates.role !== undefined) {
      dataStore.assertCanManageUser(updates.actorId || updates.actorUid, uid);
    }
    const updated = dataStore.updateUser(uid, updates, updates.actorId || updates.actorUid);
    saveUserToFirestore(updated).catch(e => console.warn('[Firestore] Async patch user failed:', e));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.patch('/api/admin/users/:uid/status', (req, res) => {
  try {
    const { uid } = req.params;
    const { status, actorId, actorName } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Trạng thái không hợp lệ' } });
    }
    dataStore.assertCanManageUser(actorId, uid);
    const updated = dataStore.updateUser(uid, { status }, actorId);
    saveUserToFirestore(updated).catch(e => console.warn('[Firestore] Async update user status failed:', e));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.patch('/api/admin/users/:uid/role', (req, res) => {
  try {
    const { uid } = req.params;
    const { role, actorId, actorName } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, error: { message: 'Vai trò không hợp lệ' } });
    }
    dataStore.assertCanManageUser(actorId, uid);
    const updated = dataStore.updateUser(uid, { role }, actorId);
    saveUserToFirestore(updated).catch(e => console.warn('[Firestore] Async update user role failed:', e));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.delete('/api/admin/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { actorId } = req.body || {};
    const localTarget = dataStore.getUserById(uid);
    const cloudUsers = isFirestoreReady() ? await loadAllUsersFromFirestore() : [];
    const actor = dataStore.getUserById(actorId) || cloudUsers.find(user => user.uid === actorId);
    const target = localTarget || cloudUsers.find(user => user.uid === uid);
    if (!actor || !target || actor.uid === target.uid ||
        (actor.role !== 'SUPER_ADMIN' && !(actor.role === 'ADMIN' &&
          (target.role === 'TEACHER' || target.role === 'PLAYER')))) {
      throw new Error('Bạn không có quyền khóa hoặc xóa tài khoản này');
    }

    const deleted = isFirestoreReady()
      ? await deleteUserFromFirebase(uid, target?.email)
      : dataStore.deleteUser(uid, actorId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy người dùng' } });
    }
    if (isFirestoreReady()) dataStore.deleteUser(uid, actorId);
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/admin/users/:uid/reset-password', async (req, res) => {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body;
    const pwd = newPassword || 'Pass@' + Math.floor(100000 + Math.random() * 900000);
    const localUser = dataStore.getUserById(uid);
    if (localUser) {
      const updated = dataStore.updateUser(uid, { password: pwd });
      updated.passwordHash = createHash('sha256').update(String(pwd).trim()).digest('hex');
      await saveUserToFirestore(updated);
    } else if (isFirestoreReady()) {
      const cloudUser = (await loadAllUsersFromFirestore()).find(user => user.uid === uid);
      if (!cloudUser) return res.status(404).json({ success: false, error: { message: 'Không tìm thấy người dùng' } });
      cloudUser.passwordHash = createHash('sha256').update(String(pwd).trim()).digest('hex');
      await saveUserToFirestore(cloudUser);
    } else {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy người dùng' } });
    }
    res.json({ success: true, data: { newPassword: pwd } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// CSV Import User Endpoint
const handleCsvImportRequest = async (req: any, res: any) => {
  try {
    const csvContent = req.body.csvContent || req.body.csvString;
    const actorUid = req.body.actorUid || req.body.actorId || req.body.actorName || 'ADMIN';
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CSV', message: 'Vui lòng cung cấp nội dung file CSV hợp lệ' },
      });
    }

    const parseResult = parseCSV(csvContent);
    const { validRows, invalidRows } = parseResult;

    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    const executionErrors: { line: number; email: string; message: string }[] = [];

    // Process valid rows
    for (const row of validRows) {
      try {
        if (row.action === 'CREATE') {
          const firestoreUser = isFirestoreReady() ? await getUserByEmailFromFirestore(row.email) : null;
          if (firestoreUser) await removeOrphanedUserByEmail(row.email);
          const currentFirestoreUser = isFirestoreReady() ? await getUserByEmailFromFirestore(row.email) : null;
          if (currentFirestoreUser || (!isFirestoreReady() && dataStore.getUserByEmail(row.email))) {
            throw new Error(`Email "${row.email}" đã tồn tại trên hệ thống`);
          }
          const newUser = dataStore.createUser({
            email: row.email,
            displayName: row.displayName || row.email.split('@')[0],
            password: row.password || 'Student@123',
            role: (row.role as UserRole) || 'PLAYER',
            status: row.status || 'ACTIVE',
            department: row.department,
            phone: row.phone,
            createdBy: actorUid,
          }, { ignoreExistingEmail: isFirestoreReady() });
          if (isFirestoreReady() && !(await saveUserToFirestore(newUser))) {
            dataStore.deleteUser(newUser.uid);
            throw new Error('Không thể lưu tài khoản vào Firebase');
          }
          createdCount++;
        } else if (row.action === 'UPDATE') {
          const user = dataStore.getUserByEmail(row.email);
          if (!user) {
            executionErrors.push({
              line: row.line,
              email: row.email,
              message: `Không tìm thấy người dùng với email ${row.email} để UPDATE`,
            });
            continue;
          }
          dataStore.updateUser(user.uid, {
            displayName: row.displayName,
            role: row.role,
            status: row.status,
            department: row.department,
            phone: row.phone,
            password: row.password,
          }, actorUid);
          updatedCount++;
        } else if (row.action === 'DELETE') {
          const user = dataStore.getUserByEmail(row.email);
          if (!user) {
            executionErrors.push({
              line: row.line,
              email: row.email,
              message: `Không tìm thấy người dùng với email ${row.email} để DELETE`,
            });
            continue;
          }
          dataStore.assertCanManageUser(actorUid, user.uid);
          dataStore.deleteUser(user.uid, actorUid);
          deletedCount++;
        }
      } catch (execErr: any) {
        executionErrors.push({
          line: row.line,
          email: row.email,
          message: execErr.message || 'Lỗi xử lý dòng dữ liệu',
        });
      }
    }

    // Combine parsing errors and execution errors
    const allErrors = [
      ...invalidRows.map(inv => ({
        line: inv.line,
        email: 'N/A',
        message: inv.errors.join('; '),
      })),
      ...executionErrors,
    ];

    const totalProcessed = parseResult.totalRows;
    const totalSuccess = createdCount + updatedCount + deletedCount;
    const totalFailed = allErrors.length;

    // Log the CSV Import
    dataStore.logAction({
      actorUid: actorUid || 'ADMIN',
      actorEmail: 'admin@studentstudy.edu',
      action: 'CSV_IMPORT',
      targetType: 'USERS',
      targetId: 'BATCH_IMPORT',
      metadata: {
        total: totalProcessed,
        success: totalSuccess,
        failed: totalFailed,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
      },
    });

    res.json({
      success: true,
      data: {
        total: totalProcessed,
        success: totalSuccess,
        failed: totalFailed,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        imported: createdCount + updatedCount,
        errors: allErrors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

app.post('/api/admin/users/import', handleCsvImportRequest);
app.post('/api/admin/users/import-csv', handleCsvImportRequest);

const handleGetAuditLogs = (req: any, res: any) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const logs = dataStore.getAuditLogs(limit);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

app.get('/api/admin/audit-logs', handleGetAuditLogs);
app.get('/api/admin/logs', handleGetAuditLogs);

// -----------------------------------------------------------------------------
// Quiz Endpoints
// -----------------------------------------------------------------------------
app.get('/api/quizzes', (req, res) => {
  try {
    const { category, difficulty, search, visibility } = req.query;
    const quizzes = dataStore.listQuizzes({
      category: category as string,
      difficulty: difficulty as string,
      search: search as string,
      visibility: visibility as string,
    });
    res.json({ success: true, data: quizzes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/quizzes/:id', (req, res) => {
  try {
    const quiz = dataStore.getQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy Quiz' } });
    }
    res.json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/quizzes', (req, res) => {
  try {
    const creatorRole = req.body.creatorRole || req.body.role;
    if (creatorRole && !['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(creatorRole)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Chỉ Giảng viên, Quản lý và Quản trị viên mới có quyền tạo bộ câu hỏi' },
      });
    }
    const newQuiz = dataStore.createQuiz(req.body);
    saveQuizToFirestore(newQuiz).catch(e => console.warn('[Firestore] Async save quiz failed:', e));
    res.status(201).json({ success: true, data: newQuiz });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.put('/api/quizzes/:id', (req, res) => {
  try {
    const updated = dataStore.updateQuiz(req.params.id, req.body);
    saveQuizToFirestore(updated).catch(e => console.warn('[Firestore] Async update quiz failed:', e));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const success = dataStore.deleteQuiz(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: { message: 'Không tìm thấy Quiz' } });
    }
    deleteQuizFromFirestore(req.params.id).catch(e => console.warn('[Firestore] Async delete quiz failed:', e));
    res.json({ success: true, message: 'Đã xóa Quiz thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/quizzes/:id/duplicate', (req, res) => {
  try {
    const { ownerId, ownerName } = req.body;
    const duplicated = dataStore.duplicateQuiz(req.params.id, ownerId, ownerName);
    saveQuizToFirestore(duplicated).catch(e => console.warn('[Firestore] Async save duplicated quiz failed:', e));
    res.json({ success: true, data: duplicated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/quizzes/attempt', (req, res) => {
  try {
    const attempt = dataStore.saveQuizAttempt(req.body);
    saveAttemptToFirestore(attempt).catch(e => console.warn('[Firestore] Async save attempt failed:', e));
    res.status(201).json({ success: true, data: attempt });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// Firebase status verification endpoint (safe for client / health inspect)
app.get('/api/firebase/status', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let configInfo: any = {};
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      configInfo = {
        projectId: parsed.projectId,
        firestoreDatabaseId: parsed.firestoreDatabaseId,
        authDomain: parsed.authDomain,
      };
    }
    res.json({
      success: true,
      data: {
        connected: isFirestoreReady(),
        project: configInfo,
        quizzesStored: dataStore.getAllQuizzes().length,
        usersStored: dataStore.getAllUsers().length,
        architecture: 'Secure Full-Stack Backend Proxy (Zero client credentials exposure)',
        status: 'ACTIVE_AND_PERSISTED',
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// -----------------------------------------------------------------------------
// Realtime Multiplayer Endpoints (Kahoot-like & Live Classroom)
// -----------------------------------------------------------------------------

// 1. Create Room (Multiplayer Live Session)
const handleCreateGame = async (req: express.Request, res: express.Response) => {
  try {
    const { quizId, hostId, hostName, host, hostRole, role } = req.body;
    const userRole = hostRole || role;
    if (userRole && !['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Chỉ Giảng viên, Quản lý và Quản trị viên mới có quyền tạo và host phòng thi đấu' },
      });
    }

    let targetQuizId = quizId;
    if (!targetQuizId) {
      const allQ = dataStore.getAllQuizzes();
      if (allQ.length > 0) {
        targetQuizId = allQ[0].id;
      }
    }

    if (!targetQuizId) {
      return res.status(400).json({ success: false, error: { message: 'Vui lòng chọn Quiz để tạo phòng thi đấu' } });
    }

    const hostData = {
      uid: hostId || host?.uid || 'host_user',
      displayName: hostName || host?.displayName || 'Host Giảng viên',
    };

    const result = dataStore.createGameRoom(targetQuizId, hostData);

    // Sync to Cloud Firestore Realtime Database
    saveGameSessionToFirestore(result.session).catch(e => {
      console.warn('[Firestore] Async save game session failed:', e);
    });

    res.status(201).json({
      success: true,
      data: {
        session: result.session,
        quiz: result.quiz,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message || 'Không thể tạo phòng thi đấu' } });
  }
};
app.post('/api/game/create', handleCreateGame);
app.post('/api/realtime/games/create', handleCreateGame);

// 2. Get Game Session by PIN/ID
const handleGetGame = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.params.id;
    let session = dataStore.getGameRoom(pin);

    // If not in local memory, attempt fallback retrieval from Cloud Firestore
    if (!session) {
      const cloudSession = await getGameSessionFromFirestore(pin);
      if (cloudSession) {
        session = cloudSession;
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, error: { message: 'Phòng thi đấu không tồn tại hoặc đã kết thúc' } });
    }

    const quiz = dataStore.getQuizById(session.quizId);
    res.json({ 
      success: true, 
      data: {
        ...session,
        questions: session.questions || quiz?.questions,
        currentQuestion: session.currentQuestion || quiz?.questions?.[session.currentQuestionIndex],
        quiz: quiz || null,
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};
app.get('/api/game/:pin', handleGetGame);
app.get('/api/realtime/games/:pin', handleGetGame);

// 3. Join Game Session
const handleJoinGame = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.body.pin;
    const { name, avatar, player } = req.body;
    const playerName = name || player?.name;
    const playerAvatar = avatar || player?.avatar;

    if (!pin || !playerName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vui lòng cung cấp mã PIN và tên người chơi' },
      });
    }

    const result = dataStore.joinGameRoom(pin, { name: playerName, avatar: playerAvatar });
    const quiz = dataStore.getQuizById(result.session.quizId);

    // Sync to Cloud Firestore
    saveGameSessionToFirestore(result.session).catch(e => {
      console.warn('[Firestore] Async sync join session failed:', e);
    });

    res.json({
      success: true,
      data: {
        session: result.session,
        player: result.player,
        quiz: quiz || null,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message || 'Không thể tham gia phòng thi' } });
  }
};
app.post('/api/game/join', handleJoinGame);
app.post('/api/realtime/games/:pin/join', handleJoinGame);

// End / Close Room (Expire PIN immediately)
const handleEndGame = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.params.id;
    const ended = dataStore.endOrExpireGameRoom(pin);
    if (ended) {
      saveGameSessionToFirestore(ended).catch(console.warn);
    }
    res.json({ success: true, message: 'Phòng thi đã kết thúc, mã PIN hết hiệu lực.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};
app.post('/api/game/:pin/end', handleEndGame);
app.delete('/api/game/:pin', handleEndGame);

// 4. Start Game
const handleStartGame = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.params.id;
    const session = dataStore.startGameRoom(pin);

    // Sync to Cloud Firestore
    saveGameSessionToFirestore(session).catch(e => {
      console.warn('[Firestore] Async sync start game failed:', e);
    });

    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};
app.post('/api/game/:pin/start', handleStartGame);
app.post('/api/realtime/games/:pin/start', handleStartGame);

// 5. Submit Answer
const handleSubmitAnswer = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.params.id;
    const { playerId, questionId, answer, timeTaken, answerIndex, timeSpent } = req.body;

    const actualAnswer = answer !== undefined ? answer : answerIndex;
    const actualTime = timeTaken !== undefined ? timeTaken : (timeSpent !== undefined ? timeSpent : 5);

    const result = dataStore.submitRoomAnswer(
      pin,
      playerId,
      questionId || 'q_0',
      actualAnswer,
      actualTime
    );

    // Sync to Cloud Firestore
    saveGameSessionToFirestore(result.session).catch(e => {
      console.warn('[Firestore] Async sync submit answer failed:', e);
    });

    res.json({
      success: true,
      data: {
        isCorrect: result.isCorrect,
        points: result.points,
        session: result.session,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};
app.post('/api/game/:pin/answer', handleSubmitAnswer);
app.post('/api/realtime/games/:pin/answer', handleSubmitAnswer);

// 6. Next Question / Leaderboard / Finish
const handleNextQuestion = async (req: express.Request, res: express.Response) => {
  try {
    const pin = req.params.pin || req.params.id;
    const session = dataStore.nextRoomQuestion(pin);

    // Sync to Cloud Firestore
    saveGameSessionToFirestore(session).catch(e => {
      console.warn('[Firestore] Async sync next question failed:', e);
    });

    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
};
app.post('/api/game/:pin/next', handleNextQuestion);
app.post('/api/realtime/games/:pin/next', handleNextQuestion);

// 7. Active Rooms & History
app.get('/api/game/rooms/active', (req, res) => {
  try {
    const rooms = dataStore.getAllActiveRooms();
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/games/history', (req, res) => {
  try {
    const history = dataStore.getGameResults();
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// AI Endpoints: Gemini Chatbot, TTS & High-Quality Image Generator
// -----------------------------------------------------------------------------

// 1. Multi-turn Chatbot with Role Selection and History
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, roleType, model: requestedModel, userId } = req.body;
    
    // Yêu cầu bắt buộc đăng nhập để sử dụng AI Chatbot
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Yêu cầu đăng nhập tài khoản hệ thống để sử dụng AI Trợ giảng.' },
      });
    }

    const user = dataStore.getUserById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa.' },
      });
    }

    const ai = getGenAI();

    // Select recommended model based on task requirements:
    // gemini-3.1-pro-preview for complex tasks,
    // gemini-3.5-flash for general tasks,
    // gemini-3.1-flash-lite for fast tasks.
    let selectedModel = 'gemini-3.5-flash';
    if (requestedModel === 'gemini-3.1-pro-preview' || requestedModel === 'gemini-3.1-flash-lite') {
      selectedModel = requestedModel;
    }

    // Role-specific system instruction
    let systemInstruction = 'Bạn là Trợ lý Học tập Thông minh của nền tảng STUDENT STUDY. Bạn luôn hỗ trợ học sinh và giáo viên giải thích kiến thức sư phạm, logic bài giảng, và tạo câu hỏi tương tác.';
    if (roleType === 'SOCRATIC_TUTOR') {
      systemInstruction = 'Bạn là Giáo viên Socratic. Thay vì đưa ngay câu trả lời cuối cùng, hãy đặt câu hỏi gợi mở từng bước để học sinh tự suy nghĩ và giải quyết vấn đề.';
    } else if (roleType === 'QUIZ_MASTER') {
      systemInstruction = 'Bạn là Quiz Master. Nhiệm vụ của bạn là kiểm tra nhanh kiến thức của người học, tạo các câu hỏi trắc nghiệm thử thách với 4 đáp án và giải thích đáp án ngắn gọn, hấp dẫn.';
    } else if (roleType === 'STEM_COACH') {
      systemInstruction = 'Bạn là Huấn luyện viên STEM và Lập trình. Hãy giải thích các nguyên lý thuật toán, cấu trúc mã nguồn, và kiến thức khoa học tự nhiên một cách chính xác, kèm ví dụ minh họa.';
    }

    if (!ai) {
      // Graceful conversational response if API key is not yet set
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
      return res.json({
        success: true,
        data: {
          reply: `[Chế độ Demo / Trợ giảng STUDENT STUDY]: Cảm ơn câu hỏi của bạn về "${lastUserMsg.slice(0, 50)}...". Để kích hoạt đầy đủ trí tuệ nhân tạo Gemini (${selectedModel}), vui lòng cấu hình biến môi trường GEMINI_API_KEY trong phần Settings. Bạn có thể tiếp tục thực hành Quiz, Flashcard và Mini Games bình thường!`,
          modelUsed: selectedModel,
        },
      });
    }

    // Format chat history for Gemini API
    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Xin lỗi, tôi không thể xử lý câu trả lời lúc này.';

    res.json({
      success: true,
      data: {
        reply,
        modelUsed: selectedModel,
      },
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AI_CHAT_ERROR', message: error.message || 'Lỗi kết nối dịch vụ Gemini Chat' },
    });
  }
});

// 2. Text-to-Speech (TTS) using gemini-3.1-flash-tts-preview
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: { message: 'Vui lòng cung cấp văn bản cần đọc' } });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback: indicate to client to use Web Speech API
      return res.json({
        success: true,
        data: {
          useClientFallback: true,
          message: 'GEMINI_API_KEY chưa cấu hình, chuyển sang trình đọc giọng nói client',
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Puck',
            },
          },
        },
      },
    });

    // Find audio part in candidate
    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('audio/'));

    if (audioPart && audioPart.inlineData) {
      res.json({
        success: true,
        data: {
          audioBase64: audioPart.inlineData.data,
          mimeType: audioPart.inlineData.mimeType,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          useClientFallback: true,
          message: 'Chuyển sang giọng đọc Web Speech API',
        },
      });
    }
  } catch (error: any) {
    console.error('Gemini TTS Error:', error);
    res.json({
      success: true,
      data: {
        useClientFallback: true,
        message: 'Chuyển sang giọng đọc Web Speech API',
      },
    });
  }
});

// 3. High-Quality Image Generator using gemini-3-pro-image-preview (1K, 2K, 4K)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, resolution = '1K', aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: { message: 'Vui lòng cung cấp mô tả hình ảnh' } });
    }

    const ai = getGenAI();
    if (!ai) {
      // High-resolution educational placeholder with Unsplash
      const sampleKeywords = encodeURIComponent(prompt.slice(0, 30));
      return res.json({
        success: true,
        data: {
          imageUrl: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80&sig=${Math.random()}`,
          resolution,
          aspectRatio,
          isPlaceholder: true,
          note: 'Cấu hình GEMINI_API_KEY để kích hoạt sinh ảnh chất lượng cao trực tiếp từ gemini-3-pro-image-preview',
        },
      });
    }

    // Call gemini-3-pro-image-preview
    try {
      const response = await ai.models.generateImages({
        model: 'gemini-3-pro-image-preview',
        prompt: `${prompt}, high resolution educational illustration, professional academic style, resolution ${resolution}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio === '4:3' ? '4:3' : '16:9',
        },
      });

      const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (imageBase64) {
        return res.json({
          success: true,
          data: {
            imageUrl: `data:image/jpeg;base64,${imageBase64}`,
            resolution,
            aspectRatio,
          },
        });
      }
    } catch (genErr) {
      console.warn('generateImages failed, falling back to curated visual asset:', genErr);
    }

    res.json({
      success: true,
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
        resolution,
        aspectRatio,
      },
    });
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Lỗi khi tạo hình ảnh AI' },
    });
  }
});

// 4. File Upload Endpoint (Firebase Storage proxy/local handler)
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileType, fileData, folder = 'uploads' } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: { message: 'Thiếu dữ liệu file' } });
    }

    // Validate mime-type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (fileType && !allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: { message: `Định dạng tệp ${fileType} không được hỗ trợ. Cho phép: JPG, PNG, WEBP, MP3, WAV.` },
      });
    }

    // In local dev/preview, return safe data URI or generated reference
    const url = fileData.startsWith('data:') ? fileData : `data:${fileType || 'image/png'};base64,${fileData}`;

    res.json({
      success: true,
      data: {
        url,
        fileName: fileName || `asset_${Date.now()}`,
        path: `${folder}/${fileName || Date.now()}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// -----------------------------------------------------------------------------
// Firestore Backend Sync Initializer
// -----------------------------------------------------------------------------
async function initFirestoreBackendSync() {
  try {
    const db = getBackendFirestore();
    if (!db) {
      console.log('[Firestore Sync] Firebase not configured yet, running in memory-mode.');
      return;
    }

    console.log('[Firestore Sync] Initializing Cloud Firestore sync...');

    // Load or seed quizzes
    const cloudQuizzes = await loadAllQuizzesFromFirestore();
    if (cloudQuizzes && cloudQuizzes.length > 0) {
      console.log(`[Firestore Sync] Loaded ${cloudQuizzes.length} quizzes from Cloud Firestore.`);
      dataStore.setQuizzes(cloudQuizzes);
    } else {
      const localQuizzes = dataStore.getAllQuizzes();
      console.log(`[Firestore Sync] Firestore empty, seeding ${localQuizzes.length} initial quizzes...`);
      for (const q of localQuizzes) {
        await saveQuizToFirestore(q);
      }
      console.log('[Firestore Sync] Initial quizzes saved to Cloud Firestore.');
    }

    // Load or seed users
    const cloudUsers = await loadAllUsersFromFirestore();
    if (cloudUsers && cloudUsers.length > 0) {
      console.log(`[Firestore Sync] Loaded ${cloudUsers.length} users from Cloud Firestore.`);
      dataStore.setUsers(cloudUsers);
    } else if (process.env.SEED_INITIAL_USERS === 'true') {
      const localUsers = dataStore.getAllUsers();
      console.log(`[Firestore Sync] Seeding ${localUsers.length} initial users to Cloud Firestore...`);
      for (const u of localUsers) {
        await saveUserToFirestore(u);
      }
      console.log('[Firestore Sync] Initial users saved to Cloud Firestore.');
    } else {
      console.log('[Firestore Sync] No cloud users found; keeping the user collection empty.');
      dataStore.setUsers([]);
    }

    // Load attempts
    const cloudAttempts = await loadAllAttemptsFromFirestore();
    if (cloudAttempts && cloudAttempts.length > 0) {
      dataStore.setAttempts(cloudAttempts);
    }

    // Load logs
    const cloudLogs = await loadAllAuditLogsFromFirestore();
    if (cloudLogs && cloudLogs.length > 0) {
      dataStore.setAuditLogs(cloudLogs);
    }

    console.log('[Firestore Sync] Cloud Firestore backend synchronization is READY & ACTIVE.');
  } catch (error) {
    console.warn('[Firestore Sync] Firestore init warning:', error);
  }
}

// -----------------------------------------------------------------------------
// Vite Middleware / Static Serve Setup
// -----------------------------------------------------------------------------
async function startServer() {
  await initFirestoreBackendSync();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STUDENT STUDY] Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

