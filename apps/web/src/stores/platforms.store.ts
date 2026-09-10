import { create } from 'zustand';
import { Platform } from '@webotp/shared/types';
import { platformsService, CreatePlatformDto, UpdatePlatformDto } from '../services/api/platforms';
import i18n from '../i18n';

interface PlatformsState {
  platforms: Platform[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // Actions
  loadPlatforms: (page?: number, limit?: number) => Promise<void>;
  createPlatform: (data: CreatePlatformDto) => Promise<void>;
  updatePlatform: (id: string, data: UpdatePlatformDto) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
  clearError: () => void;
}

export const usePlatformsStore = create<PlatformsState>((set) => ({
  platforms: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },

  loadPlatforms: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await platformsService.findAll(page, limit);
      set({
        platforms: response.platforms,
        pagination: {
          page,
          limit,
          total: response.total
        },
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || i18n.t('errors.loadPlatformsFailed'),
        isLoading: false
      });
    }
  },


  createPlatform: async (data: CreatePlatformDto) => {
    set({ isLoading: true, error: null });
    try {
      const newPlatform = await platformsService.create(data);
      set(state => ({
        platforms: [...state.platforms, newPlatform],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || i18n.t('errors.createPlatformFailed'),
        isLoading: false
      });
      throw error;
    }
  },

  updatePlatform: async (id: string, data: UpdatePlatformDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPlatform = await platformsService.update(id, data);
      set(state => ({
        platforms: state.platforms.map(p =>
          p.id === id ? updatedPlatform : p
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || i18n.t('errors.updatePlatformFailed'),
        isLoading: false
      });
      throw error;
    }
  },

  deletePlatform: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await platformsService.delete(id);
      set(state => ({
        platforms: state.platforms.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || i18n.t('errors.deletePlatformFailed'),
        isLoading: false
      });
      throw error;
    }
  },


  clearError: () => set({ error: null }),
}));
