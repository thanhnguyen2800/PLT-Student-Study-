import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Trash2, 
  Search, 
  FileText, 
  Activity, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Edit,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Inbox,
  MessageSquare
} from 'lucide-react';
import { User, UserRole, UserStatus, AuditLog, SupportMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, StatusBadge } from '../components/common/Badge';
import { AuditLogViewer } from '../components/admin/AuditLogViewer';
import { EditUserModal } from '../components/admin/EditUserModal';

export const AdminPage: React.FC = () => {
  const { currentUser, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS' | 'METRICS' | 'SUPPORT'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Pagination State (10 users per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  
  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('PLAYER');
  const [newUserDept, setNewUserDept] = useState('Khoa Công nghệ thông tin');

  // CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvResult, setCsvResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // User Actions State
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetResultSuccess, setResetResultSuccess] = useState<{ email: string; password: string } | null>(null);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [firebaseInfo, setFirebaseInfo] = useState<{
    connected: boolean;
    project?: { projectId: string; firestoreDatabaseId: string };
    quizzesStored?: number;
    usersStored?: number;
  } | null>(null);

  const fetchFirebaseStatus = async () => {
    try {
      const res = await fetch('/api/firebase/status');
      const json = await res.json();
      if (json.success && json.data) {
        setFirebaseInfo(json.data);
      }
    } catch (e) {
      console.error('Lỗi khi tải trạng thái Firebase:', e);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success && json.data) {
        const list = Array.isArray(json.data)
          ? json.data
          : (Array.isArray(json.data.users) ? json.data.users : (Array.isArray(json.users) ? json.users : []));
        setUsers(list);
      } else if (Array.isArray(json.users)) {
        setUsers(json.users);
      }
    } catch (e) {
      console.error('Lỗi khi tải danh sách người dùng:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const json = await res.json();
      if (json.success && json.data) {
        const list = Array.isArray(json.data)
          ? json.data
          : (Array.isArray(json.data.logs) ? json.data.logs : []);
        setAuditLogs(list);
      }
    } catch (e) {
      console.error('Lỗi khi tải audit logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchSupportMessages = async () => {
    setIsLoadingSupport(true);
    try {
      const res = await fetch('/api/admin/support-messages');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSupportMessages(json.data);
      }
    } catch (e) {
      console.error('Lỗi khi tải tin nhắn hỗ trợ:', e);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  const handleUpdateSupportStatus = async (id: string, status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      const res = await fetch(`/api/admin/support-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setSupportMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        setActionFeedback({ type: 'success', message: 'Cập nhật trạng thái tin nhắn hỗ trợ thành công' });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: 'Lỗi cập nhật trạng thái tin nhắn' });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchSupportMessages();
    fetchFirebaseStatus();
  }, []);

  if (!canAccess(['ADMIN', 'SUPER_ADMIN'])) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Truy cập bị từ chối (403 Forbidden)</h2>
        <p className="text-xs text-slate-500">Khu vực này chỉ dành riêng cho Ban Quản Trị Hệ Thống.</p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    if (!newUserPassword || newUserPassword.length < 6) {
      setActionFeedback({ type: 'error', message: 'Mật khẩu khởi tạo phải có tối thiểu 6 ký tự.' });
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword,
          displayName: newUserName.trim(),
          role: newUserRole,
          department: newUserDept,
          actorId: currentUser?.uid,
          actorEmail: currentUser?.email,
          actorName: currentUser?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        setActionFeedback({ type: 'success', message: `Đã tạo tài khoản "${newUserName.trim() || newUserEmail.trim()}" thành công!` });
        await fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({ type: 'error', message: json.error?.message || 'Không thể tạo người dùng' });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Lỗi kết nối khi tạo người dùng' });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setActionLoadingUid(user.uid);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actorId: currentUser?.uid,
          actorName: currentUser?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: 'success',
          message: `Đã ${nextStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản "${user.email}" thành công!`,
        });
        await fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({
          type: 'error',
          message: json.error?.message || 'Không thể thay đổi trạng thái tài khoản',
        });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Lỗi khi cập nhật trạng thái' });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${user.uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          actorId: currentUser?.uid,
          actorName: currentUser?.displayName,
        }),
      });
      if (res.ok) {
        fetchUsers();
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDeleteUser(user);
  };

  const handleExecuteDelete = async (user: User) => {
    setActionLoadingUid(user.uid);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser?.uid,
          actorName: currentUser?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfirmDeleteUser(null);
        setActionFeedback({
          type: 'success',
          message: `Đã xóa vĩnh viễn tài khoản "${user.email}" khỏi hệ thống thành công!`,
        });
        await fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({
          type: 'error',
          message: json.error?.message || 'Không thể xóa tài khoản',
        });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Lỗi kết nối khi xóa tài khoản' });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setActionLoadingUid(resetPasswordUser.uid);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.uid}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: newResetPassword.trim() || undefined,
          actorId: currentUser?.uid,
          actorName: currentUser?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResetResultSuccess({ email: resetPasswordUser.email, password: json.data.newPassword });
        setResetPasswordUser(null);
        setNewResetPassword('');
        setActionFeedback({
          type: 'success',
          message: `Đã cấp lại mật khẩu cho tài khoản "${resetPasswordUser.email}" thành công!`,
        });
        fetchLogs();
      } else {
        setActionFeedback({
          type: 'error',
          message: json.error?.message || 'Không thể cấp lại mật khẩu',
        });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Lỗi khi cấp lại mật khẩu' });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleCsvImport = async () => {
    if (!csvContent.trim()) return;
    try {
      const res = await fetch('/api/admin/users/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvString: csvContent,
          actorId: currentUser?.uid,
          actorEmail: currentUser?.email,
          actorName: currentUser?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCsvResult({
          imported: json.data.imported,
          errors: (json.data.errors || []).map((error: { line: number; email: string; message: string }) =>
            `Dòng ${error.line} (${error.email}): ${error.message}`
          ),
        });
        fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({
          type: 'error',
          message: json.error?.message || 'Không thể nhập danh sách tài khoản từ file CSV',
        });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', message: e.message || 'Lỗi kết nối khi nhập danh sách tài khoản' });
    }
  };

  const handleCsvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvContent(await file.text());
    setCsvResult(null);
    event.target.value = '';
  };

  const handleDownloadCsvTemplate = () => {
    const template = [
      'action,email,displayName,password,role,status,department,phone',
      'CREATE,user01@studentstudy.edu.vn,Nguyễn Mai Lan,MatKhau#2026,PLAYER,ACTIVE,Khoa CNTT,0912345678',
      'CREATE,user02@studentstudy.edu.vn,Đặng Văn Nam,MatKhau#2026,PLAYER,ACTIVE,Khoa Kinh Tế,0912345679',
    ].join('\r\n');
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studentstudy_users_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const userList = Array.isArray(users) ? users : [];
  const logList = Array.isArray(auditLogs) ? auditLogs : [];

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Format date helper: standard DD/MM/YYYY, converting any 2025 date to today 01/10/2026
  const formatCreationDate = (isoString?: string) => {
    if (!isoString) return '01/10/2026';
    if (isoString.includes('2025')) return '01/10/2026';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        const parts = isoString.slice(0, 10).split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return isoString.slice(0, 10);
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return isoString.slice(0, 10);
    }
  };

  const getCreatedAtTimestamp = (u: User) => {
    const raw = u.createdAt;
    if (!raw) return new Date('2026-10-01T00:00:00.000Z').getTime();
    if (raw.includes('2025')) return new Date('2026-10-01T00:00:00.000Z').getTime();
    const t = new Date(raw).getTime();
    return isNaN(t) ? new Date('2026-10-01T00:00:00.000Z').getTime() : t;
  };

  const filteredUsers = userList
    .filter(u => {
      if (!u) return false;
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const dept = (u.department || '').toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = name.includes(q) || email.includes(q) || dept.includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      // Sắp xếp: Tài khoản tạo trước thì số 1, tạo sau thì số 2, 3, 4... (createdAt tăng dần)
      const diff = getCreatedAtTimestamp(a) - getCreatedAtTimestamp(b);
      if (diff !== 0) return diff;
      return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });

  // Pagination calculations (10 users / page)
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const canManageUser = (user: User) => {
    if (!currentUser) return false;
    const isSelf = currentUser.uid === user.uid || (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase());
    if (isSelf) return false;
    const actorRole = (currentUser.role || '').toUpperCase();
    const targetRole = (user.role || '').toUpperCase();
    if (actorRole === 'SUPER_ADMIN') return true;
    if (actorRole === 'ADMIN') {
      return targetRole !== 'SUPER_ADMIN';
    }
    return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <span>Bảng Quản Trị Hệ Thống (RBAC)</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Cấp phát tài khoản, phân quyền học viên/giảng viên và giám sát nhật ký bảo mật
          </p>
          {firebaseInfo?.connected && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Cloud Firestore ({firebaseInfo.project?.projectId}):</span>
              <span>Đã kết nối qua Backend Proxy (Bảo mật tối đa, không lộ API key trên UI)</span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tài khoản ({userList.length})
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Nhật ký Audit ({logList.length})
          </button>
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'METRICS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Thống kê
          </button>
          <button
            onClick={() => {
              setActiveTab('SUPPORT');
              fetchSupportMessages();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SUPPORT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Hộp thư hỗ trợ ({supportMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl text-sm flex items-center justify-between border shadow-xs animate-in fade-in ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* --- TAB 1: USERS MANAGEMENT --- */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm email, họ tên, phòng ban..."
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="TEACHER">Giảng viên</option>
                <option value="PLAYER">Học viên</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setShowCsvModal(true);
                  setCsvResult(null);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập danh sách CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Cấp tài khoản mới
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {isLoadingUsers ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách tài khoản...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Không tìm thấy người dùng nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4 text-center w-14 sm:w-16">STT</th>
                      <th className="p-4">Họ và tên / Email</th>
                      <th className="p-4">Vai trò (Role)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Đơn vị / Khoa</th>
                      <th className="p-4">Ngày cấp</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedUsers.map((user, idx) => {
                      const globalIndex = startIndex + idx + 1;
                      return (
                        <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {globalIndex}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                                alt={user.displayName}
                                className="w-8 h-8 rounded-xl object-cover"
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{user.displayName || 'Chưa đặt tên'}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            {currentUser?.role === 'SUPER_ADMIN' ? (
                              <select
                                value={user.role}
                                onChange={e => handleChangeRole(user, e.target.value as UserRole)}
                                className="bg-transparent text-xs font-semibold cursor-pointer outline-none"
                              >
                                <option value="SUPER_ADMIN">👑 Super Admin</option>
                                <option value="ADMIN">Quản trị viên</option>
                                <option value="TEACHER">Giảng viên</option>
                                <option value="PLAYER">Học viên</option>
                              </select>
                            ) : (
                              <RoleBadge role={user.role} />
                            )}
                          </td>

                          <td className="p-4">
                            <StatusBadge status={user.status} />
                          </td>

                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {user.department || 'Chung'}
                          </td>

                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
                            {formatCreationDate(user.createdAt)}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canManageUser(user) ? (
                                <>
                                  <button
                                    type="button"
                                    id={`btn-edit-user-${user.uid}`}
                                    onClick={() => setEditingUser(user)}
                                    disabled={actionLoadingUid === user.uid}
                                    title="Chỉnh sửa thông tin và mật khẩu học viên / giảng viên"
                                    className="px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-400 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Sửa</span>
                                  </button>
                                  <button
                                    type="button"
                                    id={`btn-toggle-status-${user.uid}`}
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={actionLoadingUid === user.uid}
                                    title={user.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Kích hoạt lại tài khoản này'}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-xs disabled:opacity-50 ${
                                      user.status === 'ACTIVE'
                                        ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400'
                                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                                    }`}
                                  >
                                    {user.status === 'ACTIVE' ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Khóa</span>
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Mở khóa</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    id={`btn-delete-user-${user.uid}`}
                                    onClick={() => handleDeleteUser(user)}
                                    disabled={actionLoadingUid === user.uid}
                                    title="Xóa vĩnh viễn tài khoản khỏi Firebase và hệ thống"
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic px-2 py-1">
                                  {currentUser?.uid === user.uid || (currentUser?.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase())
                                    ? '(Chính bạn)'
                                    : '--'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Bar */}
            {filteredUsers.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span>
                    Hiển thị <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> trong tổng số <strong className="text-indigo-600 dark:text-indigo-400">{filteredUsers.length}</strong> tài khoản
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          safeCurrentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 font-semibold"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: AUDIT LOGS --- */}
      {activeTab === 'LOGS' && (
        <AuditLogViewer 
          logs={logList} 
          isLoading={isLoadingLogs} 
          onRefresh={fetchLogs} 
        />
      )}

      {/* --- TAB 3: SYSTEM METRICS --- */}
      {activeTab === 'METRICS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng số tài khoản đã cấp</p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{userList.length}</p>
            <p className="text-[11px] text-slate-500">
              {userList.filter(u => u.status === 'ACTIVE').length} đang hoạt động bình thường
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase">Chính sách bảo mật</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">100% RBAC</p>
            <p className="text-[11px] text-slate-500">Chặn hoàn toàn đăng ký công khai trái phép</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase">Nhật ký Audit bảo vệ</p>
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{logList.length}</p>
            <p className="text-[11px] text-slate-500">Ghi vết mọi thay đổi vai trò và trạng thái</p>
          </div>
        </div>
      )}

      {/* --- TAB 4: SUPPORT MESSAGES & TICKETS --- */}
      {activeTab === 'SUPPORT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Danh sách yêu cầu hỗ trợ & góp ý từ người dùng
                </h3>
                <p className="text-xs text-slate-500">
                  Dữ liệu được lưu trữ tự động trong Firebase Firestore (Collection: <code className="text-emerald-600">supportMessages</code>)
                </p>
              </div>
            </div>
            <button
              onClick={fetchSupportMessages}
              disabled={isLoadingSupport}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>{isLoadingSupport ? 'Đang làm mới...' : 'Làm mới danh sách'}</span>
            </button>
          </div>

          {supportMessages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Hộp thư hỗ trợ đang trống</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi người dùng gửi phản hồi hoặc thắc mắc từ form hỗ trợ ở chân trang, tin nhắn sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {supportMessages.map(msg => (
                <div 
                  key={msg.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {msg.id.replace('msg_', 'TK-').toUpperCase()}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {msg.fullName}
                      </span>
                      <span className="text-xs text-slate-400">
                        &lt;{msg.email}&gt;
                      </span>
                      {msg.userRole && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {msg.userRole}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                      </span>
                      {/* Status toggle selector */}
                      <select
                        value={msg.status}
                        onChange={(e) => handleUpdateSupportStatus(msg.id, e.target.value as any)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                          msg.status === 'NEW' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' 
                            : msg.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        <option value="NEW">🟡 Mới</option>
                        <option value="IN_PROGRESS">🔵 Đang xử lý</option>
                        <option value="RESOLVED">🟢 Đã giải quyết</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      📌 Chủ đề: {msg.subject}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed font-sans">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Đã lưu vào Firebase Firestore</span>
                    <a
                      href={`mailto:${msg.email}?subject=Phản hồi hỗ trợ [${msg.id.replace('msg_', 'TK-').toUpperCase()}]: ${encodeURIComponent(msg.subject)}`}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Gửi email phản hồi cho học viên</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Cấp phát tài khoản người dùng mới
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="VD: Lê Thị Hồng"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email trường học *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="name@studentstudy.vn"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="PLAYER">Học viên (Player)</option>
                    <option value="TEACHER">Giảng viên (Teacher)</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                    {currentUser?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu ban đầu
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khoa / Phòng ban
                </label>
                <input
                  type="text"
                  value={newUserDept}
                  onChange={e => setNewUserDept(e.target.value)}
                  placeholder="VD: Khoa Ngoại ngữ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Cấp tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              Nhập danh sách tài khoản hàng loạt (Batch CSV)
            </h3>
            
            <p className="text-xs text-slate-500">
              Định dạng các cột: <code>action,email,displayName,password,role,status,department,phone</code>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Download className="w-3.5 h-3.5" />
                Tải CSV mẫu
              </button>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-3.5 h-3.5" />
                Chọn file CSV
                <input type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} className="hidden" />
              </label>
            </div>

            <textarea
              rows={6}
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
                placeholder={`action,email,displayName,password,role,status,department,phone\nCREATE,user01@studentstudy.edu.vn,Nguyễn Mai Lan,MatKhau#2026,PLAYER,ACTIVE,Khoa CNTT,0912345678\nCREATE,user02@studentstudy.edu.vn,Đặng Văn Nam,MatKhau#2026,PLAYER,ACTIVE,Khoa Kinh Tế,0912345679`}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            />

            {csvResult && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                csvResult.errors.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              }`}>
                <p>Đã nhập thành công {csvResult.imported} tài khoản vào Firebase.</p>
                {csvResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 font-normal">
                    {csvResult.errors.map(error => <li key={error}>{error}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                disabled={!csvContent.trim()}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                Tiến hành Nhập dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Xác nhận xóa tài khoản vĩnh viễn</h3>
                <p className="text-xs text-slate-500">Tài khoản này sẽ bị xóa khỏi Firebase và hệ thống hoàn toàn</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmDeleteUser.displayName || 'Chưa đặt tên'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{confirmDeleteUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vai trò:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmDeleteUser.role}</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              💡 Lưu ý: Sau khi xóa, bạn hoặc quản trị viên có thể tạo lại tài khoản với email này bất kỳ lúc nào mà không bị báo lỗi "đã tồn tại".
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoadingUid === confirmDeleteUser.uid}
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoadingUid === confirmDeleteUser.uid}
                onClick={() => handleExecuteDelete(confirmDeleteUser)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoadingUid === confirmDeleteUser.uid ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Cấp lại mật khẩu người dùng
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tài khoản:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{resetPasswordUser.displayName || 'Chưa đặt tên'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{resetPasswordUser.email}</span>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới (Để trống để hệ thống tự tạo mật khẩu ngẫu nhiên an toàn)
                </label>
                <input
                  type="text"
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  placeholder="Để trống = Mật khẩu ngẫu nhiên"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoadingUid === resetPasswordUser.uid}
                  onClick={() => {
                    setResetPasswordUser(null);
                    setNewResetPassword('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingUid === resetPasswordUser.uid}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoadingUid === resetPasswordUser.uid ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Xác nhận cấp lại</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Result Success Modal */}
      {resetResultSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Mật khẩu mới đã được cấp thành công
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Vui lòng sao chép và gửi mật khẩu mới này cho người dùng <strong className="font-semibold text-slate-900 dark:text-white">{resetResultSuccess.email}</strong>:
            </p>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <code className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 select-all">
                {resetResultSuccess.password}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetResultSuccess.password);
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer"
              >
                Sao chép
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetResultSuccess(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        currentUserRole={currentUser?.role}
        existingUsers={users}
        onClose={() => setEditingUser(null)}
        onSaved={async () => {
          setActionFeedback({
            type: 'success',
            message: 'Đã cập nhật thông tin và đồng bộ với Firebase thành công!',
          });
          await fetchUsers();
          fetchLogs();
        }}
      />

    </div>
  );
};
