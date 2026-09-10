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
  nextPage: number | null;
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
    nextPage: null,

    loadUserPlatforms: async (page = 1, limit = 20) => {
      set({ isLoading: true, error: null });
      try {
        const { data, total, hasMore } = await userPlatformsService.findAll(page, limit);
        set({
          userPlatforms: data,
          total,
          currentPage: page,
          isLoading: false,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.loadUserPlatformsFailed'),
          isLoading: false,
        });
      }
    },

    loadMoreUserPlatforms: async (limit = 20) => {
      const state = get();
      if (state.isLoadingMore || !state.hasMore || state.nextPage === null) return;

      const page = state.nextPage;
      set({ isLoadingMore: true, error: null });
      try {
        const { data, total, hasMore } = await userPlatformsService.findAll(page, limit);
        set(currentState => ({
          userPlatforms: [...currentState.userPlatforms, ...data],
          total,
          currentPage: page,
          isLoadingMore: false,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
        }));
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.loadMoreFailed'),
          isLoadingMore: false,
        });
      }
    },

    createUserPlatform: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const newUserPlatform = await userPlatformsService.create(data);
        await get().loadUserPlatforms();
        return newUserPlatform;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.createUserPlatformFailed'),
          isLoading: false,
        });
        throw error;
      }
    },

    deleteUserPlatform: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await userPlatformsService.delete(id);
        await get().loadUserPlatforms();
      } catch (error: any) {
        set({
          error: error.response?.data?.message || i18n.t('errors.deleteUserPlatformFailed'),
          isLoading: false,
        });
        throw error;
      }
    },

    generateOTP: async (id) => {
      if (ongoingOTPGenerations.has(id)) {
        throw new Error('OTP generation already in progress for this platform');
      }
      ongoingOTPGenerations.add(id);
      set({ error: null });
      try {
        const otpResponse = await userPlatformsService.generateOTP(id);
        set(state => ({ otpData: new Map(state.otpData).set(id, otpResponse) }));
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
    clearOTPData: (id) => set(state => {
      const otpData = new Map(state.otpData);
      otpData.delete(id);
      return { otpData };
    }),
    resetUserPlatforms: () => set({
      userPlatforms: [],
      total: 0,
      currentPage: 1,
      hasMore: true,
      nextPage: null,
    }),
  };
});
