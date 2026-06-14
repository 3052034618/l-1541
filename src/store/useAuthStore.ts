import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

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
      set({ currentUser: user, isLoggedIn: true });
    }
  },

  logout: () => {
    set({ currentUser: null, isLoggedIn: false });
  },

  getCurrentUserRole: () => {
    return get().currentUser?.role || null;
  },
}));
