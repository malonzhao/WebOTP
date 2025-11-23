import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthService } from '../services/api/auth';

export const useAuthStore: any = create(
  persist(
    (set: any, get: any) => ({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: null,
      user: null,
      updatePasswordLoading: false,
      updatePasswordError: null,
      updatePasswordSuccess: false,
      updateUsernameLoading: false,
      updateUsernameError: null,
      updateUsernameSuccess: false,

      login: async (credentials: any) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await authService.login(credentials);
          AuthService.setTokens(tokens);
          set({
            tokens,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      loadCurrentUser: async () => {
        const currentState = get();
        if (currentState.user) {
          return;
        }
        try {
          const user = await authService.getCurrentUser();
          set({ user });
        } catch (error: any) {
          console.error('Failed to load user data:', error);
        }
      },

      logout: async () => {
        try {
          const tokens = get().tokens;
          if (tokens?.refreshToken) {
            await authService.logout(tokens.refreshToken);
          }
          AuthService.clearTokens();
          set({
            tokens: null,
            isAuthenticated: false,
            user: null
          });
        } catch (error) {
          AuthService.clearTokens();
          set({
            tokens: null,
            isAuthenticated: false,
            user: null
          });
        }
      },

      updatePassword: async (updatePasswordDto: any) => {
        set({
          updatePasswordLoading: true,
          updatePasswordError: null,
          updatePasswordSuccess: false,
        });
        try {
          await authService.updatePassword(updatePasswordDto);
          set({
            updatePasswordLoading: false,
            updatePasswordSuccess: true,
          });
        } catch (error: any) {
          set({
            updatePasswordError: error.response?.data?.message || 'Password update failed',
            updatePasswordLoading: false,
          });
          throw error;
        }
      },

      updateUsername: async (updateUsernameDto: any) => {
        set({
          updateUsernameLoading: true,
          updateUsernameError: null,
          updateUsernameSuccess: false,
        });
        try {
          await authService.updateUsername(updateUsernameDto);
          const currentState = get();
          if (currentState.user) {
            set({
              user: { ...currentState.user, username: updateUsernameDto.username },
              updateUsernameLoading: false,
              updateUsernameSuccess: true,
            });
          } else {
            set({
              updateUsernameLoading: false,
              updateUsernameSuccess: true,
            });
          }
        } catch (error: any) {
          set({
            updateUsernameError: error.response?.data?.message || 'Username update failed',
            updateUsernameLoading: false,
          });
          throw error;
        }
      },

      clearUpdatePasswordState: () => set({
        updatePasswordError: null,
        updatePasswordSuccess: false,
      }),

      clearUpdateUsernameState: () => set({
        updateUsernameError: null,
        updateUsernameSuccess: false,
      }),

      handleTokenExpired: () => {
        // Clear all authentication state when token expires
        AuthService.clearTokens();
        set({
          isAuthenticated: false,
          tokens: null,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: any) => ({
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
let authInitialized = false;
// Initialize auth state from localStorage
export const initializeAuthState = async () => {
  // Prevent execution when window is undefined (server-side check)
  if (typeof window === 'undefined') {
    return;
  }

  // Check global flag to prevent duplicate API calls
  if (authInitialized) {
    return;
  }

  try {
    authInitialized = true;
    const tokens = AuthService.getTokens();

    if (tokens) {
      const user = await authService.getCurrentUser();
      useAuthStore.setState({
        tokens,
        user,
        isAuthenticated: true
      });
    } else {
      console.error('No tokens found');
    }
  } catch (e) {
    console.error('Auth initialization failed:', e);
    AuthService.clearTokens();
    useAuthStore.setState({
      tokens: null,
      user: null,
      isAuthenticated: false
    });
  }
};
