import { create } from 'zustand';

export const useAuthStore = create((set)=>({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAccessToken: (accessToken) => set({ accessToken }),

    login : (user , accessToken) => set({
        user: user,
        accessToken: accessToken,
        isAuthenticated: true
    }),
    logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false
    })

}))