import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Lock, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Cloud,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';
import { 
  validateDisplayName, 
  validateEmail, 
  validatePassword, 
  validateAvatarFile, 
  PRESET_AVATARS 
} from '../../utils/validation';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  currentUserRole?: UserRole;
  existingUsers: User[];
  onClose: () => void;
  onSaved: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  currentUserRole,
  existingUsers,
  onClose,
  onSaved,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('PLAYER');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');

  // Optional password change
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setRole(user.role || 'PLAYER');
      setDepartment(user.department || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      setStatus(user.status || 'ACTIVE');
      setChangePassword(false);
      setNewPassword('');
      setFormError(null);
      setFormSuccess(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Handle avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setFormError(validation.message || 'Tệp ảnh không hợp lệ');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // 1. Validate display name
    const nameVal = validateDisplayName(displayName);
    if (!nameVal.isValid) {
      setFormError(nameVal.message || 'Họ và tên không hợp lệ');
      return;
    }

    // 2. Validate email
    const emailVal = validateEmail(email, user.uid, existingUsers);
    if (!emailVal.isValid) {
      setFormError(emailVal.message || 'Email không hợp lệ');
      return;
    }

    // 3. Validate password if admin entered one
    if (changePassword && newPassword) {
      const pwdVal = validatePassword(newPassword);
      if (!pwdVal.isValid) {
        setFormError(pwdVal.message || 'Mật khẩu mới không hợp lệ');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          role,
          department: department.trim(),
          phone: phone.trim(),
          avatarUrl,
          status,
          ...(changePassword && newPassword ? { password: newPassword } : {}),
          actorRole: currentUserRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFormSuccess('Đã cập nhật thông tin và đồng bộ với Firebase thành công!');
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      } else {
        setFormError(json.error?.message || 'Không thể cập nhật người dùng');
      }
    } catch (err: any) {
      setFormError(err.message || 'Lỗi kết nối khi cập nhật người dùng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Cập Nhật Thông Tin Tài Khoản
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân quyền vai trò, cập nhật thông tin học viên & giảng viên
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {formError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt="Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-xs"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Tải ảnh mới"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Ảnh đại diện người dùng
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Tải ảnh lên (Max 3MB)</span>
                </button>
                <span className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, WEBP</span>
              </div>
            </div>
          </div>

          {/* Preset Avatar Selection */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Hoặc chọn mẫu nhanh:</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.slice(0, 6).map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  title={preset.label}
                  className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    avatarUrl === preset.url
                      ? 'border-indigo-600 ring-2 ring-indigo-400/40 scale-105'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Họ và tên *
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  maxLength={50}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Họ và tên..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email đăng nhập *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  maxLength={100}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@studentstudy.edu..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vai trò (Role) *
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="PLAYER">Học viên (Player)</option>
                <option value="TEACHER">Giảng viên (Teacher)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">👑 Super Admin</option>}
              </select>
            </div>

            {/* Status Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Trạng thái tài khoản *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ACTIVE">🟢 Hoạt động (Active)</option>
                <option value="LOCKED">🔴 Khóa truy cập (Locked)</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Khoa / Lớp / Phòng ban
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  maxLength={80}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Khoa CNTT, Lớp K21A..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  maxLength={15}
                  onChange={e => setPhone(e.target.value.replace(/[^\d+ -]/g, ''))}
                  placeholder="0912 345 678..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Password Update */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="admin-chk-password"
                checked={changePassword}
                onChange={e => {
                  setChangePassword(e.target.checked);
                  if (!e.target.checked) setNewPassword('');
                }}
                className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="admin-chk-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Đặt mật khẩu mới cho tài khoản này
              </label>
            </div>

            {changePassword && (
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={changePassword}
                  value={newPassword}
                  minLength={6}
                  maxLength={32}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (Tối thiểu 6 ký tự)..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-sky-500" />
              <span>Đồng bộ Firestore</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Cập nhật & Đồng bộ</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
