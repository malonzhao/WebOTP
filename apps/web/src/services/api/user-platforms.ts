import { apiClient } from './client';
import { UserPlatformWithPlatform } from '@webotp/shared/types';

export interface CreateUserPlatformDto {
  platformId: string;
  accountName: string;
  secret: string;
}

export interface OTPResponse {
  token: string;
  expiresIn: number;
  serverTime: number;
  expiresAt: number;
}

export class UserPlatformsService {
  async findAll(page: number = 1, limit: number = 20): Promise<{ data: UserPlatformWithPlatform[]; total: number; hasMore: boolean }> {
    return apiClient.get(`/user-platforms?page=${page}&limit=${limit}`);
  }

  async create(createUserPlatformDto: CreateUserPlatformDto): Promise<UserPlatformWithPlatform> {
    return apiClient.post('/user-platforms', createUserPlatformDto);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/user-platforms/${id}`);
  }

  async generateBatchOTP(ids: string[]): Promise<{
    items: { id: string; token: string }[];
    serverTime: number;
    expiresAt: number;
  }> {
    return apiClient.post('/user-platforms/otp/batch', { ids });
  }

  async generateOTP(id: string): Promise<OTPResponse> {
    return apiClient.post(`/user-platforms/${id}/otp`);
  }
}

export const userPlatformsService = new UserPlatformsService();
