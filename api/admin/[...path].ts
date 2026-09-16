import { dataStore } from '../../src/lib/db/store';
import { parseCSV } from '../../src/utils/csv';
import { UserRole } from '../../src/types';
import {
  getBackendFirestore,
  isFirestoreReady,
  getUserByEmailFromFirestore,
  loadAllUsersFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
} from '../../src/lib/firebase/serverFirestore';

function json(res: any, status: number, body: any) {
  return res.status(status).json(body);
}

async function findUserByEmail(email: string) {
  const firestoreUser = isFirestoreReady() ? await getUserByEmailFromFirestore(email) : null;
  return firestoreUser || (!isFirestoreReady() ? dataStore.getUserByEmail(email) : null);
}

async function createUser(body: any, actorId?: string) {
  const { email, displayName, password, role, status, department, phone } = body;
  if (!email || !displayName || !role) {
    throw new Error('Thiếu các thông tin bắt buộc (email, displayName, role)');
  }
  if (await findUserByEmail(email)) {
    const error: any = new Error(`Email "${email}" đã tồn tại trên hệ thống`);
    error.statusCode = 409;
    throw error;
  }

  const user = dataStore.createUser({
    email,
    displayName,
    password: password || 'Student@123',
    role,
    status: status || 'ACTIVE',
    department,
    phone,
    createdBy: actorId || 'ADMIN',
  });

  if (isFirestoreReady() && !(await saveUserToFirestore(user))) {
    dataStore.deleteUser(user.uid);
    const error: any = new Error('Không thể lưu tài khoản vào Firebase. Vui lòng thử lại.');
    error.statusCode = 503;
    throw error;
  }
  return user;
}

async function importCsv(body: any, actorId?: string) {
  const csvContent = body.csvContent || body.csvString;
  if (!csvContent || typeof csvContent !== 'string') {
    const error: any = new Error('Vui lòng cung cấp nội dung file CSV hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const { validRows, invalidRows, totalRows } = parseCSV(csvContent);
  let created = 0;
  let updated = 0;
  let deleted = 0;
  const errors = invalidRows.map(item => ({ line: item.line, email: 'N/A', message: item.errors.join('; ') }));

  for (const row of validRows) {
    try {
      if (row.action === 'CREATE') {
        await createUser({
          email: row.email,
          displayName: row.displayName || row.email.split('@')[0],
          password: row.password || 'Student@123',
          role: (row.role as UserRole) || 'PLAYER',
          status: row.status || 'ACTIVE',
          department: row.department,
          phone: row.phone,
        }, actorId);
        created++;
      } else {
        const user = await findUserByEmail(row.email);
        if (!user) throw new Error(`Không tìm thấy người dùng với email ${row.email}`);
        if (!dataStore.canManageUser(actorId, user.uid)) {
          throw new Error('Bạn không có quyền thay đổi tài khoản này');
        }
        if (row.action === 'DELETE') {
          dataStore.deleteUser(user.uid, actorId);
          if (isFirestoreReady()) await deleteUserFromFirestore(user.uid);
          deleted++;
        } else {
          const updatedUser = dataStore.updateUser(user.uid, {
            displayName: row.displayName,
            role: row.role,
            status: row.status,
            department: row.department,
            phone: row.phone,
            password: row.password,
          }, actorId);
          if (isFirestoreReady()) await saveUserToFirestore(updatedUser);
          updated++;
        }
      }
    } catch (error: any) {
      errors.push({ line: row.line, email: row.email, message: error.message || 'Lỗi xử lý dòng dữ liệu' });
    }
  }

  return {
    total: totalRows,
    success: created + updated + deleted,
    failed: errors.length,
    created,
    updated,
    deleted,
    imported: created,
    errors,
  };
}

export default async function handler(req: any, res: any) {
  try {
    getBackendFirestore();
    const path = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
    const actorId = req.body?.actorId || req.body?.actorUid;

    if (path.length === 1 && path[0] === 'users' && req.method === 'GET') {
      const firestoreUsers = isFirestoreReady() ? await loadAllUsersFromFirestore() : [];
      const users = firestoreUsers.length > 0 ? firestoreUsers : dataStore.listUsers({ limit: 1000 }).users;
      return json(res, 200, { success: true, data: users, users, total: users.length, page: 1, totalPages: 1 });
    }

    if (path.length === 1 && path[0] === 'users' && req.method === 'POST') {
      const user = await createUser(req.body || {}, actorId);
      return json(res, 201, { success: true, data: user });
    }

    if (path.length === 2 && path[0] === 'users' && path[1] === 'import-csv' && req.method === 'POST') {
      const result = await importCsv(req.body || {}, actorId);
      return json(res, 200, { success: true, data: result });
    }

    if (path.length === 3 && path[0] === 'users') {
      const uid = path[1];
      if (path[2] === 'status' && (req.method === 'PATCH' || req.method === 'PUT')) {
        dataStore.assertCanManageUser(actorId, uid);
        const user = dataStore.updateUser(uid, { status: req.body?.status }, actorId);
        if (isFirestoreReady()) await saveUserToFirestore(user);
        return json(res, 200, { success: true, data: user });
      }
      if (path[2] === 'role' && (req.method === 'PATCH' || req.method === 'PUT')) {
        const user = dataStore.updateUser(uid, { role: req.body?.role }, actorId);
        if (isFirestoreReady()) await saveUserToFirestore(user);
        return json(res, 200, { success: true, data: user });
      }
    }

    if (path.length === 2 && path[0] === 'users' && req.method === 'DELETE') {
      const uid = path[1];
      dataStore.assertCanManageUser(actorId, uid);
      dataStore.deleteUser(uid, actorId);
      if (isFirestoreReady()) await deleteUserFromFirestore(uid);
      return json(res, 200, { success: true });
    }

    return json(res, 404, { success: false, error: { message: 'API không tồn tại' } });
  } catch (error: any) {
    return json(res, error.statusCode || 400, { success: false, error: { message: error.message || 'API error' } });
  }
}