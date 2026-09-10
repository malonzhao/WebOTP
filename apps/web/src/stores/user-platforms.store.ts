import { create } from 'zustand';
import { UserPlatformWithPlatform } from '@webotp/shared/types';
import { userPlatformsService, CreateUserPlatformDto, OTPResponse } from '../services/api/user-platforms';
import i18n from '../i18n';

interface UserPlatformsState {
  userPlatforms: UserPlatformWithPlatform[];
  total: number;
  currentPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  otpData: Map<string, OTPResponse>;
  hasMore: boolean;
  nextCursor: string | null;

  // Actions
  loadUserPlatforms: (page?: number, limit?: number) => Promise<void>;
  loadMoreUserPlatforms: (limit?: number) => Promise<void>;
  createUserPlatform: (data: CreateUserPlatformDto) => Promise<UserPlatformWithPlatform>;
  deleteUserPlatform: (id: string) => Promise<void>;
  generateOTP: (id: string) => Promise<OTPResponse>;
  clearError: () => void;
  clearOTPData: (id: string) => void;
  resetUserPlatforms: () => void;
}

export const useUserPlatformsStore = create<UserPlatformsState>((set, get) => {
  // Use Set to track ongoing OTP generation platforms to avoid duplicate requests
  const ongoingOTPGenerations = new Set<string>();

  return {
    userPlatforms: [],
    total: 0,
    currentPage: 1,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    otpData: new Map(),
    hasMore: true,
    nextCursor: null,

    loadUserPlatforms: async (page: number = 1, limit: number = 20) => {
      set({ isLoading: true, error: null });
      try {
        const { data, total, nextCursor } = await userPlatformsService.findAll(page, limit);
        set({
          userPlatforms: data,
          total,
          currentPage: page,
          isLoading: false,
          hasMore: !!nextCursor, // Use cursor to determine if there is more data
          nextCursor,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.loadUserPlatformsFailed'),
          isLoading: false
        });
      }
    },

    loadMoreUserPlatforms: async (limit: number = 20) => {
      const state = get();
      if (state.isLoadingMore || !state.hasMore || !state.nextCursor) return;

      set({ isLoadingMore: true, error: null });
      try {
        const { data, total, nextCursor } = await userPlatformsService.findAll(1, limit, state.nextCursor);
        set(state => ({
          userPlatforms: [...state.userPlatforms, ...data],
          total,
          isLoadingMore: false,
          hasMore: !!nextCursor, // Use cursor to determine if there is more data
          nextCursor,
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.loadMoreFailed'),
          isLoadingMore: false
        });
      }
    },


    createUserPlatform: async (data: CreateUserPlatformDto) => {
      set({ isLoading: true, error: null });
      try {
        const newUserPlatform = await userPlatformsService.create(data);
        // Reload the list to get updated data with pagination
        const currentState = get();
        await get().loadUserPlatforms(currentState.currentPage);
        return newUserPlatform;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.createUserPlatformFailed'),
          isLoading: false
        });
        throw error;
      }
    },


    deleteUserPlatform: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await userPlatformsService.delete(id);
        // Reload the list to get updated data with pagination
        const currentState = get();
        await get().loadUserPlatforms(currentState.currentPage);
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.deleteUserPlatformFailed'),
          isLoading: false
        });
        throw error;
      }
    },

    generateOTP: async (id: string): Promise<OTPResponse> => {
      // Check if already generating to avoid duplicate requests
      if (ongoingOTPGenerations.has(id)) {
        throw new Error('OTP generation already in progress for this platform');
      }
      ongoingOTPGenerations.add(id);
      set({ error: null });
      try {
        const otpResponse = await userPlatformsService.generateOTP(id);
        set(state => ({
          otpData: new Map(state.otpData).set(id, otpResponse),
        }));
        return otpResponse;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.generateOTPFailed'),
        });
        throw error;
      } finally {
        ongoingOTPGenerations.delete(id);
      }
    },

    clearError: () => set({ error: null }),
    clearOTPData: (id: string) => set(state => {
      const newOtpData = new Map(state.otpData);
      newOtpData.delete(id);
      return { otpData: newOtpData };
    }),
    resetUserPlatforms: () => set({
      userPlatforms: [],
      total: 0,
      currentPage: 1,
      hasMore: true,
      nextCursor: null
    }),
  };
});
