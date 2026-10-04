import { create } from 'zustand';

export const useAuthStore = create((set)=>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAccessToken: (accessToken) => set({ accessToken }),

    login : (user , accessToken) => set({
        user: user,
        accessToken: accessToken,
        isAuthenticated: true,
        isLoading: false,
    }),
    logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
    }),

    setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

    finishLoading: () =>
    set({
      isLoading: false,
    }),

}))