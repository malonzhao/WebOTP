import { create } from 'zustand';
import { UserPlatformWithPlatform } from '@webotp/shared/types';
import { userPlatformsService, CreateUserPlatformDto, OTPResponse } from '../services/api/user-platforms';
import i18n from '../i18n';

interface UserPlatformsState {
  userPlatforms: UserPlatformWithPlatform[];
  total: number;
  search: string;
  currentPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  otpData: Map<string, OTPResponse & { localExpiresAt: number }>;
  refreshingPlatforms: Set<string>;
  hasMore: boolean;
  nextPage: number | null;
  loadUserPlatforms: (page?: number, limit?: number, search?: string) => Promise<void>;
  loadMoreUserPlatforms: (limit?: number) => Promise<void>;
  createUserPlatform: (data: CreateUserPlatformDto) => Promise<UserPlatformWithPlatform>;
  deleteUserPlatform: (id: string) => Promise<void>;
  refreshOTPs: (ids: string[]) => Promise<void>;
  clearError: () => void;
  clearOTPData: (id: string) => void;
  resetUserPlatforms: () => void;
}

export const useUserPlatformsStore = create<UserPlatformsState>((set, get) => {
  let activeRefresh: Promise<void> | null = null;
  let generation = 0;
  let retryAt = 0;
  let listRequest = 0;

  return {
    userPlatforms: [],
    total: 0,
    search: '',
    currentPage: 1,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    otpData: new Map(),
    refreshingPlatforms: new Set(),
    hasMore: true,
    nextPage: null,

    loadUserPlatforms: async (page = 1, limit = 20, search = get().search) => {
      const request = ++listRequest;
      const session = generation;
      set({ isLoading: true, isLoadingMore: false, error: null, search });
      try {
        const { data, total, hasMore } = await userPlatformsService.findAll(page, limit, search);
        if (request !== listRequest || session !== generation) return;
        set({
          userPlatforms: data,
          total,
          currentPage: page,
          isLoading: false,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
        });
      } catch (error: any) {
        if (request !== listRequest || session !== generation) return;
        set({
          error: error.response?.data?.message || i18n.t('errors.loadUserPlatformsFailed'),
          isLoading: false,
        });
      }
    },

    loadMoreUserPlatforms: async (limit = 20) => {
      const state = get();
      if (state.isLoading || state.isLoadingMore || !state.hasMore || state.nextPage === null) return;

      const page = state.nextPage;
      const request = listRequest;
      const session = generation;
      set({ isLoadingMore: true, error: null });
      try {
        const { data, total, hasMore } = await userPlatformsService.findAll(page, limit, state.search);
        if (request !== listRequest || session !== generation) return;
        set(currentState => ({
          userPlatforms: [...currentState.userPlatforms, ...data],
          total,
          currentPage: page,
          isLoadingMore: false,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
        }));
      } catch (error: any) {
        if (request !== listRequest || session !== generation) return;
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

    refreshOTPs: async (ids) => {
      const currentGeneration = generation;
      // Share the in-flight request, then recheck which newly loaded IDs still need data.
      if (activeRefresh) {
        await activeRefresh;
        if (generation !== currentGeneration) return;
        return get().refreshOTPs(ids);
      }
      if (Date.now() < retryAt) return;
      const loaded = new Set(get().userPlatforms.map(item => item.id));
      const needed = [...new Set(ids)].filter(id => loaded.has(id) &&
        (get().otpData.get(id)?.localExpiresAt ?? 0) <= Date.now());
      if (!needed.length) return;
      set({ refreshingPlatforms: new Set(needed), error: null });
      const request = (async () => {
        try {
          for (let start = 0; start < needed.length; start += 200) {
            const requestedAt = Date.now();
            const response = await userPlatformsService.generateBatchOTP(needed.slice(start, start + 200));
            const receivedAt = Date.now();
            if (generation !== currentGeneration) return;
            // Midpoint clock calibration estimates transit time; never count timer ticks.
            const localExpiresAt = receivedAt + response.expiresAt - response.serverTime -
              (receivedAt - requestedAt) / 2;
            set(state => {
              const otpData = new Map(state.otpData);
              const currentIds = new Set(state.userPlatforms.map(item => item.id));
              for (const item of response.items) {
                if (currentIds.has(item.id)) otpData.set(item.id, {
                  token: item.token,
                  expiresIn: Math.ceil((response.expiresAt - response.serverTime) / 1000),
                  serverTime: response.serverTime,
                  expiresAt: response.expiresAt,
                  localExpiresAt,
                });
              }
              return { otpData };
            });
          }
          // Avoid a request loop if a slow response has already expired.
          if (needed.some(id => (get().otpData.get(id)?.localExpiresAt ?? Infinity) <= Date.now())) {
            retryAt = Date.now() + 1000;
          }
        } catch (error: any) {
          if (generation !== currentGeneration) return;
          retryAt = Date.now() + 5000;
          set({ error: error.response?.data?.message || i18n.t('errors.generateOTPFailed') });
        } finally {
          if (generation === currentGeneration) set({ refreshingPlatforms: new Set() });
        }
      })();
      activeRefresh = request;
      await request;
      if (activeRefresh === request) activeRefresh = null;
    },

    clearError: () => set({ error: null }),
    clearOTPData: (id) => set(state => {
      const otpData = new Map(state.otpData);
      otpData.delete(id);
      return { otpData };
    }),
    resetUserPlatforms: () => {
      generation += 1;
      listRequest += 1;
      activeRefresh = null;
      retryAt = 0;
      set({
        otpData: new Map(),
        refreshingPlatforms: new Set(),
        userPlatforms: [],
        total: 0,
        search: '',
        currentPage: 1,
        hasMore: true,
        nextPage: null,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      });
    },
  };
});
