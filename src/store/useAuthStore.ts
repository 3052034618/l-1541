import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';
import { useLogStore } from './useLogStore';

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  users: User[];
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
  getCurrentUserRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  users: mockUsers,

  login: (role: UserRole, name?: string) => {
    const user = mockUsers.find(u => u.role === role && (!name || u.name.includes(name)));
    if (user) {
      const roleNames: Record<UserRole, string> = {
        donor: '献血者',
        nurse: '护士',
        director: '血站主任',
      };
      set({ currentUser: user, isLoggedIn: true });
      
      useLogStore.getState().addLog(
        user.id,
        user.name,
        `${roleNames[role]} ${user.name} 登录系统（人脸识别验证通过）`
      );
    }
  },

  logout: () => {
    const currentUser = get().currentUser;
    if (currentUser) {
      useLogStore.getState().addLog(
        currentUser.id,
        currentUser.name,
        `退出登录`
      );
    }
    set({ currentUser: null, isLoggedIn: false });
  },

  getCurrentUserRole: () => {
    return get().currentUser?.role || null;
  },
}));
