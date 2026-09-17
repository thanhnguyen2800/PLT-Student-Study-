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
  BarChart3
} from 'lucide-react';
import { User, UserRole, UserStatus, AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, StatusBadge } from '../components/common/Badge';

export const AdminPage: React.FC = () => {
  const { currentUser, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS' | 'METRICS'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Admin@123');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('PLAYER');
  const [newUserDept, setNewUserDept] = useState('Khoa Công nghệ thông tin');

  // CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvResult, setCsvResult] = useState<{ imported: number; errors: string[] } | null>(null);

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

  useEffect(() => {
    fetchUsers();
    fetchLogs();
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
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          displayName: newUserName,
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
        fetchUsers();
        fetchLogs();
      } else {
        alert(json.error?.message || 'Không thể tạo người dùng');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo người dùng');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
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
      if (res.ok) {
        fetchUsers();
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
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

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản: ${user.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        alert(json.error?.message || 'Không thể nhập danh sách tài khoản');
      }
    } catch (e) {
      console.error(e);
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
      'CREATE,student1@studentstudy.vn,Nguyễn Mai Lan,Admin@123,PLAYER,ACTIVE,Khoa CNTT,0912345678',
      'CREATE,student2@studentstudy.vn,Đặng Văn Nam,Admin@123,PLAYER,ACTIVE,Khoa Kinh Tế,0912345679',
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

  const filteredUsers = userList.filter(u => {
    if (!u) return false;
    const name = (u.displayName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const dept = (u.department || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = name.includes(q) || email.includes(q) || dept.includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const canManageUser = (user: User) => {
    if (!currentUser || currentUser.uid === user.uid) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return currentUser.role === 'ADMIN' && (user.role === 'TEACHER' || user.role === 'PLAYER');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Bảng Quản Trị Hệ Thống (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cấp phát tài khoản, phân quyền học viên/giảng viên và giám sát nhật ký bảo mật
          </p>
          {firebaseInfo?.connected && (
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Cloud Firestore ({firebaseInfo.project?.projectId}):</span>
              <span>Đã kết nối qua Backend Proxy (Bảo mật tối đa, không lộ API key trên UI)</span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'USERS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tài khoản ({userList.length})
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'LOGS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Nhật ký Audit ({logList.length})
          </button>
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'METRICS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Thống kê
          </button>
        </div>
      </div>

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
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4">Họ và tên / Email</th>
                      <th className="p-4">Vai trò (Role)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Đơn vị / Khoa</th>
                      <th className="p-4">Ngày cấp</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map(user => (
                      <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
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

                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {user.createdAt ? user.createdAt.slice(0, 10) : 'Mới tạo'}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canManageUser(user) && (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                                    user.status === 'ACTIVE'
                                      ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  {user.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                title="Xóa vĩnh viễn tài khoản"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: AUDIT LOGS --- */}
      {activeTab === 'LOGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Lịch sử thao tác & Nhật ký bảo mật (Audit Trails)
            </h3>
            <span className="text-xs text-slate-400">Tự động ghi lại mọi hành động phân quyền</span>
          </div>

          {isLoadingLogs ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải nhật ký kiểm toán...</span>
            </div>
          ) : logList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có nhật ký kiểm toán nào được ghi nhận.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logList.map(log => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{log.actorName || log.actorEmail || 'Hệ thống'}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-mono text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-slate-500">→ {log.target || log.targetId || log.targetType || ''}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{log.details || (log.metadata ? JSON.stringify(log.metadata) : '')}</p>
                  </div>

                  <span className="font-mono text-slate-400 text-[11px] shrink-0">
                    {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
                  placeholder="name@studentstudy.edu"
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
                    type="text"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
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
                placeholder={`action,email,displayName,password,role,status,department,phone\nCREATE,student1@studentstudy.vn,Nguyễn Mai Lan,Admin@123,PLAYER,ACTIVE,Khoa CNTT,0912345678\nCREATE,student2@studentstudy.vn,Đặng Văn Nam,Admin@123,PLAYER,ACTIVE,Khoa Kinh Tế,0912345679`}
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

    </div>
  );
};
