import { CSVRowData, UserRole, UserStatus } from '../types';

export interface CSVParseResult {
  validRows: CSVRowData[];
  invalidRows: { line: number; raw: string; errors: string[] }[];
  totalRows: number;
}

const VALID_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PLAYER'];
const VALID_STATUSES: UserStatus[] = ['ACTIVE', 'DISABLED'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const validRows: CSVRowData[] = [];
  const invalidRows: { line: number; raw: string; errors: string[] }[] = [];

  if (lines.length === 0) {
    return { validRows: [], invalidRows: [], totalRows: 0 };
  }

  // Check if first row is header
  let startIndex = 0;
  const firstRowLower = lines[0].toLowerCase();
  if (firstRowLower.includes('email') || firstRowLower.includes('action')) {
    startIndex = 1;
  }

  const seenEmails = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNumber = i + 1;
    
    // Parse line taking commas and potential quotes into account
    const tokens = parseCSVLine(rawLine);
    if (tokens.length < 2) {
      invalidRows.push({
        line: lineNumber,
        raw: rawLine,
        errors: ['Dòng không đủ số cột theo định dạng quy định (tối thiểu action, email)'],
      });
      continue;
    }

    const actionRaw = tokens[0]?.toUpperCase().trim();
    const email = tokens[1]?.toLowerCase().trim();
    const displayName = tokens[2]?.trim() || '';
    const password = tokens[3]?.trim() || '';
    const roleRaw = tokens[4]?.toUpperCase().trim();
    const statusRaw = tokens[5]?.toUpperCase().trim() || 'ACTIVE';
    const department = tokens[6]?.trim() || '';
    const phone = tokens[7]?.trim() || '';

    const errors: string[] = [];

    // 1. Action check
    if (!['CREATE', 'UPDATE', 'DELETE'].includes(actionRaw)) {
      errors.push(`Action không hợp lệ: "${actionRaw}". Phải là CREATE, UPDATE hoặc DELETE`);
    }

    // 2. Email check
    if (!email) {
      errors.push('Email là trường bắt buộc');
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push(`Email không đúng định dạng: "${email}"`);
    }

    if (actionRaw === 'CREATE' && seenEmails.has(email)) {
      errors.push(`Email "${email}" bị trùng lặp trong file CSV`);
    } else if (email) {
      seenEmails.add(email);
    }

    // 3. Action-specific validation
    if (actionRaw === 'CREATE') {
      if (!displayName) {
        errors.push('Họ tên (displayName) là bắt buộc khi CREATE');
      }
      if (!password) {
        errors.push('Mật khẩu (password) là bắt buộc khi CREATE (tối thiểu 6 ký tự)');
      } else if (password.length < 6) {
        errors.push('Mật khẩu phải có độ dài ít nhất 6 ký tự');
      }
      if (!roleRaw) {
        errors.push('Phân quyền (role) là bắt buộc khi CREATE (SUPER_ADMIN, ADMIN, TEACHER, PLAYER)');
      } else if (!VALID_ROLES.includes(roleRaw as UserRole)) {
        errors.push(`Role "${roleRaw}" không hợp lệ. Cho phép: ${VALID_ROLES.join(', ')}`);
      }
    }

    if (roleRaw && !VALID_ROLES.includes(roleRaw as UserRole)) {
      errors.push(`Role "${roleRaw}" không hợp lệ. Cho phép: ${VALID_ROLES.join(', ')}`);
    }

    if (statusRaw && !VALID_STATUSES.includes(statusRaw as UserStatus)) {
      errors.push(`Status "${statusRaw}" không hợp lệ. Cho phép: ${VALID_STATUSES.join(', ')}`);
    }

    if (errors.length > 0) {
      invalidRows.push({
        line: lineNumber,
        raw: rawLine,
        errors,
      });
    } else {
      validRows.push({
        line: lineNumber,
        action: actionRaw as 'CREATE' | 'UPDATE' | 'DELETE',
        email,
        displayName: displayName || undefined,
        password: password || undefined,
        role: (roleRaw as UserRole) || undefined,
        status: (statusRaw as UserStatus) || 'ACTIVE',
        department: department || undefined,
        phone: phone || undefined,
      });
    }
  }

  return {
    validRows,
    invalidRows,
    totalRows: lines.length - startIndex,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function generateSampleCSV(): string {
  return [
    'action,email,displayName,password,role,status,department,phone',
    'CREATE,student01@school.edu.vn,Nguyễn Văn An,Student@123,PLAYER,ACTIVE,Công nghệ thông tin,0912345671',
    'CREATE,student02@school.edu.vn,Trần Thị Bình,Student@123,PLAYER,ACTIVE,Kinh tế & Quản trị,0912345672',
    'CREATE,teacher01@school.edu.vn,Lê Hoàng Nam,Teacher@123,TEACHER,ACTIVE,Khoa học Tự nhiên,0912345673',
    'UPDATE,student01@school.edu.vn,Nguyễn Văn An (Cập nhật),,PLAYER,ACTIVE,Khoa Toán Tin,0912345671',
    'DELETE,olduser@school.edu.vn,,,,,,',
  ].join('\n');
}
