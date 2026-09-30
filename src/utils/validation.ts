/**
 * Validation rules and utilities for User Management and Personal Profile
 * Enforces security, character lengths, MIME types, and Firebase-safe data constraints.
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate Display Name / Full Name / Username
 * - Required, trimmed
 * - Minimum 2 characters, maximum 50 characters
 * - No script / HTML tag characters
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, message: 'Họ và tên không được để trống' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: 'Họ và tên phải có tối thiểu 2 ký tự' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'Họ và tên không được vượt quá 50 ký tự' };
  }
  if (/[<>{}]/.test(trimmed)) {
    return { isValid: false, message: 'Họ và tên chứa ký tự đặc biệt không hợp lệ' };
  }
  return { isValid: true };
}

/**
 * Validate Email address
 * - Standard RFC-compliant format
 * - Length between 5 and 100 characters
 * - Optional duplicate check against existing users
 */
export function validateEmail(
  email: string,
  currentUid?: string,
  existingUsers?: Array<{ uid: string; email: string }>
): ValidationResult {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, message: 'Địa chỉ email không được để trống' };
  }
  if (trimmed.length < 5) {
    return { isValid: false, message: 'Email phải có tối thiểu 5 ký tự' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: 'Email không được vượt quá 100 ký tự' };
  }

  // Regex for standard email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Định dạng email không hợp lệ (Ví dụ: user@studentstudy.edu)' };
  }

  // Duplicate email check
  if (existingUsers && Array.isArray(existingUsers)) {
    const isDuplicate = existingUsers.some(
      u => u.email.toLowerCase().trim() === trimmed && (!currentUid || u.uid !== currentUid)
    );
    if (isDuplicate) {
      return { isValid: false, message: `Email "${trimmed}" đã được tài khoản khác sử dụng` };
    }
  }

  return { isValid: true };
}

/**
 * Validate Password
 * - Minimum 6 characters, maximum 32 characters
 * - Must contain letters and digits for good security
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { isValid: false, strength: 'weak', message: 'Mật khẩu không được để trống' };
  }
  if (password.length < 6) {
    return { isValid: false, strength: 'weak', message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự' };
  }
  if (password.length > 32) {
    return { isValid: false, strength: 'weak', message: 'Mật khẩu không được vượt quá 32 ký tự' };
  }

  const hasLetters = /[a-zA-ZÀ-ỹ]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9À-ỹ]/.test(password);

  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (hasLetters && hasNumbers && hasSpecial && password.length >= 8) {
    strength = 'strong';
  } else if (hasLetters && hasNumbers) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  if (!hasLetters || !hasNumbers) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'Mật khẩu cần kết hợp cả chữ cái và số để đảm bảo an toàn',
    };
  }

  return { isValid: true, strength };
}

/**
 * Allowed avatar MIME types and file extensions
 */
export const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

/**
 * Validate Avatar file upload
 */
export function validateAvatarFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, message: 'Chưa chọn tệp ảnh' };
  }

  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const hasAllowedExt = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);

  if (!ALLOWED_AVATAR_TYPES.includes(fileType) && !hasAllowedExt) {
    return {
      isValid: false,
      message: 'Định dạng ảnh không hỗ trợ. Vui lòng chọn tệp JPG, JPEG, PNG, WEBP, GIF hoặc SVG.',
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      message: `Kích thước ảnh (${sizeInMb}MB) vượt quá giới hạn tối đa cho phép là 3MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Curated avatar presets for students, teachers, and admins
 */
export const PRESET_AVATARS = [
  {
    id: 'preset-female-1',
    label: 'Nữ sinh thanh lịch',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-male-1',
    label: 'Nam sinh năng động',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-teacher-1',
    label: 'Giảng viên tri thức',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-female-2',
    label: 'Nữ nghiên cứu sinh',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-male-2',
    label: 'Lập trình viên CNTT',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-admin-1',
    label: 'Quản trị viên chuyên nghiệp',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',
  },
  {
    id: 'preset-avatar-anime-1',
    label: 'Minh họa công nghệ 1',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=student_study_ai_1',
  },
  {
    id: 'preset-avatar-anime-2',
    label: 'Minh họa công nghệ 2',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=plt_academic_pro_2',
  },
];
