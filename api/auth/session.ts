import { dataStore } from '../../src/lib/db/store';
import {
  getBackendFirestore,
  isFirestoreReady,
  loadAllUsersFromFirestore,
} from '../../src/lib/firebase/serverFirestore';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: { message: 'Method không được hỗ trợ' } });

  try {
    getBackendFirestore();
    const authorization = String(req.headers.authorization || '');
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const uid = token.match(/^token_([^_]+)(?:_\d+)?$/)?.[1];
    const firestoreUsers = isFirestoreReady() ? await loadAllUsersFromFirestore() : [];
    const user = firestoreUsers.find(item => item.uid === uid) || (uid ? dataStore.getUserById(uid) : null);

    if (!user || user.status === 'DISABLED' || user.status === 'LOCKED') {
      return res.status(401).json({ success: false, error: { message: 'Tài khoản không còn hoạt động' } });
    }
    return res.status(200).json({ success: true, data: { user } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message || 'Không thể kiểm tra phiên' } });
  }
}