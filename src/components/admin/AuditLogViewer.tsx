import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  UserPlus, 
  Trash2, 
  Lock, 
  Unlock, 
  Shield, 
  FileSpreadsheet, 
  BookOpen, 
  Edit3, 
  LogIn, 
  Search, 
  RefreshCw, 
  Code, 
  Eye,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Clock,
  User
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogViewerProps {
  logs: AuditLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Translate technical role keys to Vietnamese
const translateRole = (role?: string): string => {
  if (!role) return 'Học viên';
  const r = role.toUpperCase();
  if (r === 'SUPER_ADMIN') return 'Quản trị viên cấp cao';
  if (r === 'ADMIN') return 'Quản trị viên';
  if (r === 'TEACHER') return 'Giảng viên';
  if (r === 'PLAYER' || r === 'STUDENT') return 'Học viên';
  return role;
};

// Translate status
const translateStatus = (status?: string): string => {
  if (!status) return 'Hoạt động';
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'Đang hoạt động';
  if (s === 'LOCKED') return 'Đã bị khóa';
  if (s === 'DISABLED') return 'Tạm vô hiệu';
  return status;
};

// Translate actor
const formatActor = (log: AuditLog): string => {
  const actor = log.actorName || log.actorEmail || log.actorUid || 'Hệ thống';
  if (actor.toLowerCase().includes('super admin') || actor.toLowerCase().includes('admin_system')) {
    return 'Quản trị viên cấp cao (Super Admin)';
  }
  if (actor.includes('admin@studentstudy.edu') || actor.includes('admin@studentstudy.vn')) {
    return 'Quản trị viên hệ thống';
  }
  return actor;
};

// Parse raw metadata if it's stringified JSON
const safeParseMetadata = (log: AuditLog): Record<string, any> => {
  if (log.metadata && typeof log.metadata === 'object') {
    return log.metadata;
  }
  if (typeof log.metadata === 'string') {
    try {
      return JSON.parse(log.metadata);
    } catch {
      // not JSON
    }
  }
  if (log.details && typeof log.details === 'string') {
    try {
      if (log.details.trim().startsWith('{')) {
        return JSON.parse(log.details);
      }
    } catch {
      // not JSON
    }
  }
  return {};
};

interface FormattedLogItem {
  id: string;
  category: 'create' | 'delete' | 'status' | 'role' | 'import' | 'quiz' | 'login' | 'other';
  badgeTitle: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  subDetails: { label: string; value: string }[];
  actor: string;
  timestamp: string;
  relativeTime: string;
  rawJson: string;
}

const formatLogForNonIT = (log: AuditLog): FormattedLogItem => {
  const meta = safeParseMetadata(log);
  const action = (log.action || '').toUpperCase();
  const targetId = log.targetId || log.target || '';
  const dateObj = new Date(log.timestamp || log.createdAt || Date.now());
  const timestamp = dateObj.toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calculate relative time in Vietnamese
  const diffMinutes = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60));
  let relativeTime = 'Vừa xong';
  if (diffMinutes >= 1 && diffMinutes < 60) {
    relativeTime = `${diffMinutes} phút trước`;
  } else if (diffMinutes >= 60 && diffMinutes < 1440) {
    relativeTime = `${Math.floor(diffMinutes / 60)} giờ trước`;
  } else if (diffMinutes >= 1440) {
    relativeTime = `${Math.floor(diffMinutes / 1440)} ngày trước`;
  }

  const actor = formatActor(log);
  const rawJson = JSON.stringify(
    {
      action: log.action,
      actor: log.actorName || log.actorEmail,
      target: log.targetId || log.target,
      metadata: meta,
      details: log.details,
      time: log.createdAt || log.timestamp,
    },
    null,
    2
  );

  // 1. CREATE USER
  if (action === 'CREATE_USER' || action === 'REGISTER_USER') {
    const email = meta.email || '';
    const displayName = meta.displayName || '';
    const role = translateRole(meta.role);
    const department = meta.department || '';

    const subDetails: { label: string; value: string }[] = [];
    if (email) subDetails.push({ label: 'Email', value: email });
    if (role) subDetails.push({ label: 'Vai trò', value: role });
    if (department) subDetails.push({ label: 'Đơn vị / Khoa', value: department });

    return {
      id: log.id,
      category: 'create',
      badgeTitle: 'Cấp tài khoản mới',
      badgeStyle: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
      },
      icon: UserPlus,
      headline: `Đã cấp tài khoản cho: ${displayName ? `${displayName} (${email || 'Không có email'})` : email || 'Người dùng mới'}`,
      subDetails,
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 2. DELETE USER
  if (action === 'DELETE_USER') {
    const email = meta.email || (targetId.includes('@') ? targetId : '');
    const displayName = meta.displayName || '';
    const subDetails: { label: string; value: string }[] = [];
    if (email) subDetails.push({ label: 'Tài khoản', value: email });
    subDetails.push({ label: 'Trạng thái', value: 'Đã xóa hoàn toàn khỏi cơ sở dữ liệu' });

    return {
      id: log.id,
      category: 'delete',
      badgeTitle: 'Xóa tài khoản',
      badgeStyle: {
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
      },
      icon: Trash2,
      headline: `Đã xóa vĩnh viễn tài khoản: ${displayName ? `${displayName} (${email})` : email || targetId}`,
      subDetails,
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 3. LOCK / UNLOCK / UPDATE STATUS
  if (
    action === 'LOCK_USER' ||
    action === 'UNLOCK_USER' ||
    action === 'UPDATE_USER_STATUS' ||
    (action === 'UPDATE_USER' && meta.updates?.status)
  ) {
    const isLock =
      action === 'LOCK_USER' ||
      meta.updates?.status === 'LOCKED' ||
      meta.status === 'LOCKED';

    const email = meta.email || meta.updates?.email || '';
    const subDetails: { label: string; value: string }[] = [];
    if (email) subDetails.push({ label: 'Tài khoản', value: email });
    subDetails.push({
      label: 'Tình trạng',
      value: isLock ? 'Tạm dừng đăng nhập & dự thi' : 'Đã khôi phục quyền truy cập bình thường',
    });

    return {
      id: log.id,
      category: 'status',
      badgeTitle: isLock ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      badgeStyle: isLock
        ? {
            bg: 'bg-amber-50 dark:bg-amber-950/50',
            text: 'text-amber-700 dark:text-amber-300',
            border: 'border-amber-200 dark:border-amber-800',
          }
        : {
            bg: 'bg-teal-50 dark:bg-teal-950/50',
            text: 'text-teal-700 dark:text-teal-300',
            border: 'border-teal-200 dark:border-teal-800',
          },
      icon: isLock ? Lock : Unlock,
      headline: isLock
        ? `Đã khóa quyền truy cập của: ${email || targetId}`
        : `Đã mở khóa và kích hoạt lại: ${email || targetId}`,
      subDetails,
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 4. UPDATE ROLE
  if (
    action === 'CHANGE_ROLE' ||
    action === 'UPDATE_USER_ROLE' ||
    (action === 'UPDATE_USER' && meta.updates?.role)
  ) {
    const newRole = translateRole(meta.updates?.role || meta.role);
    const email = meta.email || '';
    const subDetails: { label: string; value: string }[] = [];
    if (email) subDetails.push({ label: 'Tài khoản', value: email });
    subDetails.push({ label: 'Quyền hạn mới', value: newRole });

    return {
      id: log.id,
      category: 'role',
      badgeTitle: 'Đổi quyền hạn',
      badgeStyle: {
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      },
      icon: Shield,
      headline: `Thay đổi quyền tài khoản ${email || targetId} sang: ${newRole}`,
      subDetails,
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 5. CSV / EXCEL IMPORT
  if (action === 'CSV_IMPORT' || action === 'BULK_IMPORT') {
    const total = meta.total || 0;
    const success = meta.success || meta.created || 0;
    const created = meta.created || 0;
    const updated = meta.updated || 0;
    const failed = meta.failed || 0;

    const subDetails: { label: string; value: string }[] = [
      { label: 'Tổng số dòng', value: `${total} tài khoản` },
      { label: 'Thêm mới thành công', value: `${created} tài khoản` },
    ];
    if (updated > 0) subDetails.push({ label: 'Cập nhật', value: `${updated} tài khoản` });
    if (failed > 0) subDetails.push({ label: 'Bị lỗi/bỏ qua', value: `${failed} tài khoản` });

    return {
      id: log.id,
      category: 'import',
      badgeTitle: 'Nhập danh sách từ file (Excel/CSV)',
      badgeStyle: {
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
      },
      icon: FileSpreadsheet,
      headline: `Nhập danh sách tài khoản hàng loạt: Thành công ${success}/${total}`,
      subDetails,
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 6. QUIZ MANAGEMENT
  if (action.includes('QUIZ')) {
    const title = meta.title || log.details || 'Bộ đề Quiz';
    const isCreate = action.includes('CREATE');
    const isDelete = action.includes('DELETE');
    const isUpdate = action.includes('UPDATE');

    let badgeTitle = 'Cập nhật Quiz';
    let icon = Edit3;
    let badgeStyle = {
      bg: 'bg-sky-50 dark:bg-sky-950/50',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
    };

    if (isCreate) {
      badgeTitle = 'Tạo bộ đề Quiz mới';
      icon = BookOpen;
      badgeStyle = {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    } else if (isDelete) {
      badgeTitle = 'Xóa bộ đề Quiz';
      icon = Trash2;
      badgeStyle = {
        bg: 'bg-orange-50 dark:bg-orange-950/50',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
      };
    }

    return {
      id: log.id,
      category: 'quiz',
      badgeTitle,
      badgeStyle,
      icon,
      headline: `${badgeTitle}: "${title}"`,
      subDetails: [{ label: 'Tên đề thi', value: title }],
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 7. LOGIN
  if (action === 'LOGIN' || action === 'USER_LOGIN') {
    return {
      id: log.id,
      category: 'login',
      badgeTitle: 'Đăng nhập',
      badgeStyle: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      },
      icon: LogIn,
      headline: `Đăng nhập vào hệ thống: ${actor}`,
      subDetails: [],
      actor,
      timestamp,
      relativeTime,
      rawJson,
    };
  }

  // 8. GENERAL / UPDATE USER
  const email = meta.email || (targetId.includes('@') ? targetId : '');
  const subDetails: { label: string; value: string }[] = [];
  if (email) subDetails.push({ label: 'Tài khoản', value: email });
  if (log.details && typeof log.details === 'string' && !log.details.startsWith('{')) {
    subDetails.push({ label: 'Ghi chú', value: log.details });
  }

  return {
    id: log.id,
    category: 'other',
    badgeTitle: 'Cập nhật thông tin',
    badgeStyle: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    icon: UserCheck,
    headline: `Cập nhật hồ sơ tài khoản: ${email || targetId || 'Hệ thống'}`,
    subDetails,
    actor,
    timestamp,
    relativeTime,
    rawJson,
  };
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'FRIENDLY' | 'TECHNICAL'>('FRIENDLY');

  // Format all logs into friendly objects
  const formattedLogs = useMemo(() => {
    return (logs || []).map(formatLogForNonIT);
  }, [logs]);

  // Filter logs
  const filteredList = useMemo(() => {
    return formattedLogs.filter(item => {
      // Category filter
      if (filterType !== 'ALL') {
        if (filterType === 'USER_MANAGEMENT' && !['create', 'delete'].includes(item.category)) {
          return false;
        }
        if (filterType === 'STATUS_LOCK' && item.category !== 'status') {
          return false;
        }
        if (filterType === 'IMPORT' && item.category !== 'import') {
          return false;
        }
        if (filterType === 'QUIZ' && item.category !== 'quiz') {
          return false;
        }
      }

      // Search keyword filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchHeadline = item.headline.toLowerCase().includes(query);
        const matchBadge = item.badgeTitle.toLowerCase().includes(query);
        const matchActor = item.actor.toLowerCase().includes(query);
        const matchDetails = item.subDetails.some(
          d => d.label.toLowerCase().includes(query) || d.value.toLowerCase().includes(query)
        );
        return matchHeadline || matchBadge || matchActor || matchDetails;
      }

      return true;
    });
  }, [formattedLogs, filterType, searchTerm]);

  // Statistics summaries
  const stats = useMemo(() => {
    return {
      total: formattedLogs.length,
      create: formattedLogs.filter(l => l.category === 'create').length,
      status: formattedLogs.filter(l => l.category === 'status').length,
      delete: formattedLogs.filter(l => l.category === 'delete').length,
      import: formattedLogs.filter(l => l.category === 'import').length,
    };
  }, [formattedLogs]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Nhật ký hoạt động & Phân quyền hệ thống
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghi nhận chi tiết, dễ hiểu mọi hành động cấp phát, khóa, xóa tài khoản và quản lý đề thi
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode(v => (v === 'FRIENDLY' ? 'TECHNICAL' : 'FRIENDLY'))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            title="Chuyển chế độ xem"
          >
            {viewMode === 'FRIENDLY' ? (
              <>
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem mã kỹ thuật</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Xem dễ hiểu</span>
              </>
            )}
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick summary stats banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60">
          <p className="text-[11px] font-medium text-slate-400">Tổng thao tác</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Tài khoản cấp mới</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.create}</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Khóa / Mở khóa</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{stats.status}</p>
        </div>
        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Tài khoản đã xóa</p>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">{stats.delete}</p>
        </div>
      </div>

      {/* Search & Filter pills */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setFilterType('USER_MANAGEMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'USER_MANAGEMENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Cấp & Xóa tài khoản
          </button>
          <button
            onClick={() => setFilterType('STATUS_LOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'STATUS_LOCK'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Khóa / Mở khóa
          </button>
          <button
            onClick={() => setFilterType('IMPORT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'IMPORT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Nhập file Excel/CSV
          </button>
          <button
            onClick={() => setFilterType('QUIZ')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'QUIZ'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Đề thi Quiz
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo email, tên, người thực hiện..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main log list */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang đồng bộ và tải dữ liệu nhật ký kiểm toán...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy nhật ký phù hợp</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(item => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800/40 transition-all space-y-2.5"
              >
                {/* Top line: Badge, Headline, and Time */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl border shrink-0 mt-0.5 ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}
                        >
                          {item.badgeTitle}
                        </span>

                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.headline}
                        </span>
                      </div>

                      {/* Sub-details pills (Role, Department, etc.) in plain language */}
                      {item.subDetails.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                          {item.subDetails.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400 font-medium">{detail.label}:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {detail.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actor & Timestamp */}
                  <div className="text-left sm:text-right shrink-0 pl-11 sm:pl-0 space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-medium">{item.actor}</span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.timestamp}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium">
                        {item.relativeTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Mode: Expandable raw code view */}
                {viewMode === 'TECHNICAL' && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto">
                      <pre>{item.rawJson}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
