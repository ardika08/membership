import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { TOKEN_STORAGE_KEY } from '@/config'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isHydrated: boolean
  setSession: (payload: { user: User; token: string }) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,

      setSession: ({ user, token }) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: TOKEN_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      },
    },
  ),
)

export const selectIsAuthenticated = (state: AuthState) =>
  Boolean(state.token && state.user)

export const selectIsAdmin = (state: AuthState) => state.user?.role === 'admin'
