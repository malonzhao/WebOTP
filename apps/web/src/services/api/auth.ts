import { apiClient } from './client';
import { AuthTokens } from '@webotp/shared/types';
import { LoginDto } from './dto/auth.dto';

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateUsernameDto {
  username: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

export class AuthService {
  async login(loginDto: LoginDto): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/login', loginDto);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string): Promise<void> {
    return apiClient.post<void>('/auth/logout', { refreshToken });
  }

  async getCurrentUser(): Promise<any> {
    return apiClient.get('/users/profile');
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto): Promise<UpdatePasswordResponse> {
    return apiClient.patch<UpdatePasswordResponse>('/users/password', updatePasswordDto);
  }

  async updateUsername(updateUsernameDto: UpdateUsernameDto): Promise<any> {
    return apiClient.patch<any>('/users/username', updateUsernameDto);
  }

  // Helper methods for token management
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  static getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  }

  static clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
