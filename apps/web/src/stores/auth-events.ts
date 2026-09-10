import type { AuthTokens } from '@webotp/shared/types';
import { useAuthStore } from './auth.store';

export function registerAuthEvents(): () => void {
  const expire = () => useAuthStore.getState().handleTokenExpired();
  const refresh = (event: Event) => {
    const tokens = (event as CustomEvent<AuthTokens>).detail;
    useAuthStore.setState({ tokens });
  };

  window.addEventListener('auth-token-expired', expire);
  window.addEventListener('auth-tokens-refreshed', refresh);
  return () => {
    window.removeEventListener('auth-token-expired', expire);
    window.removeEventListener('auth-tokens-refreshed', refresh);
  };
}
