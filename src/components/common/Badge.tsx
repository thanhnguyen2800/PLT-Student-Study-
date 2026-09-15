import React from 'react';
import { UserRole, UserStatus, QuizDifficulty } from '../../types';

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const configs: Record<UserRole, { label: string; bg: string; text: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
    ADMIN: { label: 'Quản Trị Viên', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' },
    TEACHER: { label: 'Giảng Viên', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
    PLAYER: { label: 'Học Viên', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  };

  const c = configs[role] || configs.PLAYER;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
        Hoạt động
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
      Đã khóa
    </span>
  );
};

export const DifficultyBadge: React.FC<{ difficulty: QuizDifficulty }> = ({ difficulty }) => {
  const configs: Record<QuizDifficulty, { label: string; color: string }> = {
    EASY: { label: 'Cơ bản', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    MEDIUM: { label: 'Trung bình', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    HARD: { label: 'Nâng cao', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  };
  const c = configs[difficulty] || configs.MEDIUM;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};
