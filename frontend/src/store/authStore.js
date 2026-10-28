import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      language: 'en',
      
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setLanguage: (language) => set({ language }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'eventceo-auth',
      partialize: (state) => ({ token: state.token, user: state.user, language: state.language }),
    }
  )
)
