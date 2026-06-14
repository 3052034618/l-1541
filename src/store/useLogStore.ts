import { create } from 'zustand';
import type { OperationLog, UserRole } from '@/types';

interface LogState {
  logs: OperationLog[];

  addLog: (userId: string, userName: string, action: string, ip?: string) => void;
  getLogs: () => OperationLog[];
  getLogsByUser: (userId: string) => OperationLog[];
  getLogsByRole: (role: UserRole) => OperationLog[];
  getLogsByDateRange: (startDate: Date, endDate: Date) => OperationLog[];
  getRecentLogs: (limit?: number) => OperationLog[];
  clearLogs: () => void;
}

const generateId = () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getClientIP = () => {
  return '127.0.0.1';
};

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],

  addLog: (userId: string, userName: string, action: string, ip?: string) => {
    const newLog: OperationLog = {
      id: generateId(),
      userId,
      userName,
      action,
      time: new Date().toISOString(),
      ip: ip || getClientIP(),
    };

    set(state => ({
      logs: [newLog, ...state.logs],
    }));
  },

  getLogs: () => {
    return get().logs;
  },

  getLogsByUser: (userId: string) => {
    return get().logs.filter(log => log.userId === userId);
  },

  getLogsByRole: (role: UserRole) => {
    const roleUserIds: Record<UserRole, string[]> = {
      donor: ['donor001', 'donor002', 'donor003'],
      nurse: ['u002'],
      director: ['u001'],
    };
    return get().logs.filter(log => roleUserIds[role]?.includes(log.userId));
  },

  getLogsByDateRange: (startDate: Date, endDate: Date) => {
    return get().logs.filter(log => {
      const logDate = new Date(log.time);
      return logDate >= startDate && logDate <= endDate;
    });
  },

  getRecentLogs: (limit = 50) => {
    return get().logs.slice(0, limit);
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));
