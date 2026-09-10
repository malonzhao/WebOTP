import { apiClient } from './client';
import { Platform } from '@webotp/shared/types';

export interface CreatePlatformDto {
  name: string;
}

export interface UpdatePlatformDto extends Partial<CreatePlatformDto> {}

export class PlatformsService {
  async findAll(page: number = 1, limit: number = 10): Promise<{ platforms: Platform[]; total: number }> {
    return apiClient.get(`/platforms?page=${page}&limit=${limit}`);
  }

  async findById(id: string): Promise<Platform> {
    return apiClient.get(`/platforms/${id}`);
  }

  async create(createPlatformDto: CreatePlatformDto): Promise<Platform> {
    return apiClient.post('/platforms', createPlatformDto);
  }

  async update(id: string, updateData: UpdatePlatformDto): Promise<Platform> {
    return apiClient.put(`/platforms/${id}`, updateData);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/platforms/${id}`);
  }

}

export const platformsService = new PlatformsService();
