import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getStoredAuthSession,
  isTimestampExpired,
  persistAuthSession,
  clearStoredAuthSession,
} from '../utils/authStorage';
import { AuthContext } from './auth-context';
import { authApi } from '../services/api/auth';
import { configureApiClient } from '../services/api/client';
import { getApiErrorMessage } from '../utils/http';
import { getDeviceMetadata } from '../utils/device';

function toAuthState(payload) {
  return {
    user: payload.user,
    session: payload.session,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt: payload.expiresAt,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
  };
}

function normalizeTokenPayload(response) {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_at,
    refreshTokenExpiresAt: response.refresh_token_expires_at,
    user: response.user,
    session: response.session,
  };
}

export function AuthProvider({ children }) {
  const tokenRef = useRef(null);
  const hasBootstrappedRef = useRef(false);
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    refreshTokenExpiresAt: null,
  });
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearAuthState = useCallback(() => {
    tokenRef.current = null;
    clearStoredAuthSession();
    setAuthState({
      user: null,
      session: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      refreshTokenExpiresAt: null,
    });
  }, []);

  const applyTokenPayload = useCallback((payload) => {
    const nextState = toAuthState(payload);
    tokenRef.current = nextState.accessToken;
    persistAuthSession(nextState);
    setAuthState(nextState);
    return nextState;
  }, []);

  const refreshSession = useCallback(async () => {
    const persisted = getStoredAuthSession();
    const refreshToken = persisted?.refreshToken ?? authState.refreshToken;

    if (!refreshToken) {
      clearAuthState();
      return null;
    }

    if (isTimestampExpired(persisted?.refreshTokenExpiresAt ?? authState.refreshTokenExpiresAt, 30)) {
      clearAuthState();
      return null;
    }

    const response = await authApi.refresh({ refresh_token: refreshToken });
    const normalized = normalizeTokenPayload(response);
    applyTokenPayload(normalized);
    return normalized.accessToken;
  }, [applyTokenPayload, authState.refreshToken, authState.refreshTokenExpiresAt, clearAuthState]);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      refreshSession,
      onUnauthorized: clearAuthState,
    });
  }, [clearAuthState, refreshSession]);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return undefined;
    }

    hasBootstrappedRef.current = true;
    let isMounted = true;

    async function bootstrapAuth() {
      const persisted = getStoredAuthSession();

      if (!persisted) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        if (
          persisted.accessToken &&
          !isTimestampExpired(persisted.expiresAt, 30)
        ) {
          tokenRef.current = persisted.accessToken;
          setAuthState(persisted);
          const user = await authApi.getMe();
          if (isMounted) {
            const nextState = { ...persisted, user };
            persistAuthSession(nextState);
            setAuthState(nextState);
          }
        } else if (
          persisted.refreshToken &&
          !isTimestampExpired(persisted.refreshTokenExpiresAt, 30)
        ) {
          await refreshSession();
        } else {
          clearAuthState();
        }
      } catch (error) {
        clearAuthState();
        console.warn('Failed to restore auth session:', error);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState, refreshSession]);

  const signup = useCallback(async (payload) => {
    return authApi.signup(payload);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const response = await authApi.login({
        email,
        password,
        ...getDeviceMetadata(),
      });
      return applyTokenPayload(normalizeTokenPayload(response));
    },
    [applyTokenPayload],
  );

  const logout = useCallback(async () => {
    try {
      if (authState.accessToken) {
        await authApi.logout();
      }
    } finally {
      clearAuthState();
    }
  }, [authState.accessToken, clearAuthState]);

  const listSessions = useCallback(async () => {
    return authApi.listSessions();
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.accessToken && authState.user),
      isBootstrapping,
      signup,
      login,
      logout,
      listSessions,
      refreshSession,
      clearAuthState,
      getApiErrorMessage,
    }),
    [
      authState,
      clearAuthState,
      isBootstrapping,
      listSessions,
      login,
      logout,
      refreshSession,
      signup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
