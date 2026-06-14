import { create } from 'zustand';
import type { OperationLog, UserRole } from '@/types';
import { getStoredData, setStoredData, clearStoredData } from '@/lib/utils';

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

const initialLogs = getStoredData<OperationLog[]>('logs', []);

export const useLogStore = create<LogState>((set, get) => ({
  logs: initialLogs,

  addLog: (userId: string, userName: string, action: string, ip?: string) => {
    const newLog: OperationLog = {
      id: generateId(),
      userId,
      userName,
      action,
      time: new Date().toISOString(),
      ip: ip || getClientIP(),
    };

    set(state => {
      const newLogs = [newLog, ...state.logs];
      setStoredData('logs', newLogs);
      return { logs: newLogs };
    });
  },

  getLogs: () => {
    return get().logs;
  },

  getLogsByUser: (userId: string) => {
    return get().logs.filter(log => log.userId === userId);
  },

  getLogsByRole: (role: UserRole) => {
    return get().logs.filter(log => {
      if (role === 'director') return log.userId === 'u001';
      if (role === 'nurse') return log.userId === 'u002';
      if (role === 'donor') return log.userId.startsWith('donor') || log.userId === 'u003';
      return false;
    });
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
    clearStoredData('logs');
    set({ logs: [] });
  },
}));
