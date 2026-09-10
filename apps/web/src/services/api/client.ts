import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthTokens } from '@webotp/shared/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private refreshRequest: Promise<AuthTokens> | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private expireAuthentication(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new CustomEvent('auth-token-expired'));
  }

  private refreshTokens(): Promise<AuthTokens> {
    if (!this.refreshRequest) {
      this.refreshRequest = (async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const { data } = await this.client.post<AuthTokens>('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        window.dispatchEvent(new CustomEvent('auth-tokens-refreshed', { detail: data }));
        return data;
      })().catch(error => {
        this.expireAuthentication();
        throw error;
      }).finally(() => {
        this.refreshRequest = null;
      });
    }
    return this.refreshRequest;
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip token refresh for authentication endpoints
        if (error.response?.status === 401 && originalRequest &&
            !originalRequest.url?.includes('/auth')) {
          if (originalRequest._retry) {
            this.expireAuthentication();
            return Promise.reject(error);
          }
          originalRequest._retry = true;

          // A different request may already have refreshed this access token.
          let accessToken = localStorage.getItem('accessToken');
          if (!accessToken || originalRequest.headers.Authorization === `Bearer ${accessToken}`) {
            ({ accessToken } = await this.refreshTokens());
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
