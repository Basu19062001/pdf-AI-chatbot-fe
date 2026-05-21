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
import {
  extractGoogleTokenPayload,
  persistGoogleAuthReturnTo,
} from '../utils/googleAuth';

let refreshSessionPromise = null;

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
  const bootstrapPromiseRef = useRef(null);
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
    if (!refreshSessionPromise) {
      // Refresh tokens are rotated on every successful use, so concurrent refresh
      // calls must share one network request or the backend will treat the later
      // call as a stale-token replay and revoke the session.
      refreshSessionPromise = (async () => {
        const persisted = getStoredAuthSession();
        const refreshToken = persisted?.refreshToken ?? authState.refreshToken;
        const refreshTokenExpiresAt =
          persisted?.refreshTokenExpiresAt ?? authState.refreshTokenExpiresAt;

        if (!refreshToken || isTimestampExpired(refreshTokenExpiresAt, 30)) {
          return null;
        }

        const response = await authApi.refresh({ refresh_token: refreshToken });
        return normalizeTokenPayload(response);
      })().finally(() => {
        refreshSessionPromise = null;
      });
    }

    const normalized = await refreshSessionPromise;

    if (!normalized) {
      clearAuthState();
      return null;
    }

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
    let isActive = true;

    if (!bootstrapPromiseRef.current) {
      bootstrapPromiseRef.current = (async () => {
        const persisted = getStoredAuthSession();

        if (!persisted) {
          return;
        }

        if (
          persisted.accessToken &&
          !isTimestampExpired(persisted.expiresAt, 30)
        ) {
          tokenRef.current = persisted.accessToken;
          setAuthState(persisted);
          const user = await authApi.getMe();
          const nextState = { ...persisted, user };
          persistAuthSession(nextState);
          setAuthState(nextState);
          return;
        }

        if (
          persisted.refreshToken &&
          !isTimestampExpired(persisted.refreshTokenExpiresAt, 30)
        ) {
          await refreshSession();
          return;
        }

        clearAuthState();
      })()
        .catch(() => {
          clearAuthState();
        })
        .finally(() => {
          bootstrapPromiseRef.current = null;
        });
    }

    bootstrapPromiseRef.current.finally(() => {
      if (isActive) {
        setIsBootstrapping(false);
      }
    });

    return () => {
      isActive = false;
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

  const loginWithGoogle = useCallback((returnTo = '/app') => {
    persistGoogleAuthReturnTo(returnTo);
    window.location.assign(authApi.getGoogleStartUrl());
  }, []);

  const completeGoogleLogin = useCallback(async () => {
    const callbackPayload = extractGoogleTokenPayload();
    if (!callbackPayload) {
      throw new Error('Google sign-in completed, but no frontend session was returned.');
    }

    return applyTokenPayload(normalizeTokenPayload(callbackPayload));
  }, [applyTokenPayload]);

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
      loginWithGoogle,
      completeGoogleLogin,
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
      loginWithGoogle,
      completeGoogleLogin,
      logout,
      refreshSession,
      signup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
