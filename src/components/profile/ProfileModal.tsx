import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Building2, 
  Phone, 
  Eye, 
  EyeOff, 
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { 
  validateDisplayName, 
  validateEmail, 
  validatePassword, 
  validateAvatarFile, 
  PRESET_AVATARS 
} from '../../utils/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'avatar'>('info');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  // Password fields
  const [enablePasswordChange, setEnablePasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  // Handle avatar upload with strict validation
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

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setFormSuccess('Đã tải ảnh lên thành công. Hãy bấm "Lưu thay đổi" để đồng bộ.');
        setTimeout(() => setFormSuccess(null), 3500);
      }
    };
    reader.onerror = () => {
      setFormError('Không thể đọc dữ liệu ảnh. Vui lòng thử lại với ảnh khác.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setFormError(null);
    setFormSuccess('Đã chọn ảnh mẫu. Hãy bấm "Lưu thay đổi" để đồng bộ.');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // 1. Validate display name
    const nameVal = validateDisplayName(displayName);
    if (!nameVal.isValid) {
      setFormError(nameVal.message || 'Họ và tên không hợp lệ');
      setActiveTab('info');
      return;
    }

    // 2. Validate email
    const emailVal = validateEmail(email, currentUser.uid);
    if (!emailVal.isValid) {
      setFormError(emailVal.message || 'Email không hợp lệ');
      setActiveTab('info');
      return;
    }

    // 3. Validate password if user opted to change it
    if (enablePasswordChange && newPassword) {
      const pwdVal = validatePassword(newPassword);
      if (!pwdVal.isValid) {
        setFormError(pwdVal.message || 'Mật khẩu mới không hợp lệ');
        setActiveTab('security');
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError('Mật khẩu xác nhận không khớp với mật khẩu mới');
        setActiveTab('security');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        avatarUrl,
        department: department.trim(),
        phone: phone.trim(),
        ...(enablePasswordChange && newPassword
          ? {
              currentPassword: currentPassword || undefined,
              newPassword,
            }
          : {}),
      });

      setFormSuccess('Đã lưu và đồng bộ thông tin tài khoản thành công!');
      setEnablePasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setFormSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = newPassword ? validatePassword(newPassword).strength : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sky-100 dark:border-sky-900/40 space-y-6 my-8 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Hồ Sơ & Quản Lý Tài Khoản
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Cập nhật họ tên, ảnh đại diện, email và mật khẩu bảo mật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'info'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'avatar'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Ảnh đại diện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Mật khẩu & Bảo mật</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={displayName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-sky-300 dark:border-sky-700 shrink-0 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate text-base">
                      {displayName || 'Chưa đặt tên'}
                    </span>
                    <RoleBadge role={currentUser.role} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {email}
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-300 mt-0.5">
                    {department || 'Chưa thiết lập đơn vị'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Họ và tên hiển thị *</span>
                    <span className="text-[11px] font-normal text-slate-400">2 - 50 ký tự</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      maxLength={50}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Nguyễn Văn A..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Email đăng nhập *</span>
                    <span className="text-[11px] font-normal text-slate-400">Đồng bộ Firebase</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      maxLength={100}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@studentstudy.edu..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Department / Khoa / Lớp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Khoa / Lớp / Đơn vị công tác
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={department}
                      maxLength={80}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="Khoa Công nghệ thông tin..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      maxLength={15}
                      onChange={e => setPhone(e.target.value.replace(/[^\d+ -]/g, ''))}
                      placeholder="0912 345 678..."
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỔI ẢNH ĐẠI DIỆN */}
          {activeTab === 'avatar' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt="Preview avatar"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-bold">Thay ảnh</span>
                  </button>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tải lên ảnh chân dung của bạn
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Hỗ trợ định dạng: <span className="font-semibold text-sky-700 dark:text-sky-300">JPG, JPEG, PNG, WEBP, GIF, SVG</span>. Dung lượng tệp tối đa <span className="font-semibold text-sky-700 dark:text-sky-300">3MB</span>.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
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
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn tệp ảnh từ máy</span>
                    </button>
                    {avatarUrl !== currentUser.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(currentUser.avatarUrl || '')}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Đặt lại ảnh ban đầu</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatar Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hoặc chọn nhanh ảnh đại diện mẫu</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">8 mẫu thiết kế sẵn</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRESET_AVATARS.map(preset => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        title={preset.label}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-sky-500 ring-2 ring-sky-400/50 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:scale-102'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-sky-600/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỔI MẬT KHẨU & BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Quy tắc đặt mật khẩu bảo mật:</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5 text-amber-800 dark:text-amber-300">
                    <li>Độ dài tối thiểu từ <strong>6 ký tự</strong> và tối đa <strong>32 ký tự</strong></li>
                    <li>Khuyến khích kết hợp cả chữ cái, chữ số và ký tự đặc biệt</li>
                    <li>Được lưu trữ mã hóa và đồng bộ với hệ thống xác thực Firebase</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-change-pwd"
                  checked={enablePasswordChange}
                  onChange={e => {
                    setEnablePasswordChange(e.target.checked);
                    if (!e.target.checked) {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  }}
                  className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="chk-change-pwd" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                  Tôi muốn cập nhật mật khẩu mới cho tài khoản này
                </label>
              </div>

              {enablePasswordChange && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mật khẩu hiện tại (Nếu có)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đang dùng..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Mật khẩu mới *
                        </label>
                        {passwordStrength && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            passwordStrength === 'strong'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : passwordStrength === 'medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}>
                            {passwordStrength === 'strong' ? 'Mạnh' : passwordStrength === 'medium' ? 'Khá' : 'Yếu'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required={enablePasswordChange}
                          value={newPassword}
                          minLength={6}
                          maxLength={32}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự..."
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Xác nhận lại mật khẩu mới *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required={enablePasswordChange}
                          value={confirmPassword}
                          minLength={6}
                          maxLength={32}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại chính xác..."
                          className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 ${
                            confirmPassword && newPassword !== confirmPassword
                              ? 'border-rose-400 focus:ring-rose-400'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-sky-500'
                          }`}
                        />
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[11px] text-rose-500 font-semibold mt-1">
                          Mật khẩu xác nhận không trùng khớp
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Cloud className="w-4 h-4 text-sky-500" />
              <span>Đồng bộ tự động Firebase Cloud</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
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
