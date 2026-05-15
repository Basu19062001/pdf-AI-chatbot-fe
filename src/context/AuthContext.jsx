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

let refreshSessionPromise = null;

function authDebugLog(message, details) {
  if (details === undefined) {
    console.warn(`[auth-debug][context] ${message}`);
    return;
  }

  console.warn(`[auth-debug][context] ${message}`, details);
}

function summarizeToken(token) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 10)}...${token.slice(-6)}`;
}

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
  const sessionId = authState.session?.id;

  const clearAuthState = useCallback(() => {
    authDebugLog('Clearing auth state and local storage.');
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
    authDebugLog('Applying auth payload.', {
      userId: nextState.user?.id,
      sessionId: nextState.session?.id,
      accessToken: summarizeToken(nextState.accessToken),
      refreshToken: summarizeToken(nextState.refreshToken),
      expiresAt: nextState.expiresAt,
      refreshTokenExpiresAt: nextState.refreshTokenExpiresAt,
    });
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
        authDebugLog('Refresh requested.', {
          hasPersistedSession: Boolean(persisted),
          hasRefreshToken: Boolean(refreshToken),
          refreshToken: summarizeToken(refreshToken),
          refreshTokenExpiresAt,
          isRefreshTokenExpired: isTimestampExpired(refreshTokenExpiresAt, 30),
        });

        if (!refreshToken || isTimestampExpired(refreshTokenExpiresAt, 30)) {
          authDebugLog('Refresh skipped because no valid refresh token is available.');
          return null;
        }

        authDebugLog('Calling /auth/refresh.');
        const response = await authApi.refresh({ refresh_token: refreshToken });
        authDebugLog('Refresh request completed successfully.', {
          userId: response.user?.id,
          sessionId: response.session?.id,
          expiresAt: response.expires_at,
          refreshTokenExpiresAt: response.refresh_token_expires_at,
        });
        return normalizeTokenPayload(response);
      })().finally(() => {
        authDebugLog('Refresh promise settled.');
        refreshSessionPromise = null;
      });
    } else {
      authDebugLog('Reusing in-flight refresh promise.');
    }

    const normalized = await refreshSessionPromise;

    if (!normalized) {
      authDebugLog('Refresh produced no session; clearing auth state.');
      clearAuthState();
      return null;
    }

    applyTokenPayload(normalized);
    return normalized.accessToken;
  }, [applyTokenPayload, authState.refreshToken, authState.refreshTokenExpiresAt, clearAuthState]);

  useEffect(() => {
    authDebugLog('Configuring auth-aware API client.');
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      refreshSession,
      onUnauthorized: clearAuthState,
    });
  }, [clearAuthState, refreshSession]);

  useEffect(() => {
    let isActive = true;

    if (!bootstrapPromiseRef.current) {
      authDebugLog('Starting bootstrap auth flow.');
      bootstrapPromiseRef.current = (async () => {
        const persisted = getStoredAuthSession();
        authDebugLog('Bootstrapping auth state from storage.', {
          hasPersistedSession: Boolean(persisted),
          hasAccessToken: Boolean(persisted?.accessToken),
          hasRefreshToken: Boolean(persisted?.refreshToken),
          accessTokenExpiresAt: persisted?.expiresAt,
          refreshTokenExpiresAt: persisted?.refreshTokenExpiresAt,
        });

        if (!persisted) {
          authDebugLog('No persisted session found; bootstrap complete.');
          return;
        }

        if (
          persisted.accessToken &&
          !isTimestampExpired(persisted.expiresAt, 30)
        ) {
          authDebugLog('Persisted access token is still valid; fetching /auth/me.', {
            accessToken: summarizeToken(persisted.accessToken),
            expiresAt: persisted.expiresAt,
          });
          tokenRef.current = persisted.accessToken;
          setAuthState(persisted);
          const user = await authApi.getMe();
          const nextState = { ...persisted, user };
          authDebugLog('User profile restored from /auth/me.', {
            userId: user?.id,
            email: user?.email,
          });
          persistAuthSession(nextState);
          setAuthState(nextState);
          return;
        }

        if (
          persisted.refreshToken &&
          !isTimestampExpired(persisted.refreshTokenExpiresAt, 30)
        ) {
          authDebugLog('Access token expired; attempting bootstrap refresh.', {
            refreshToken: summarizeToken(persisted.refreshToken),
            refreshTokenExpiresAt: persisted.refreshTokenExpiresAt,
          });
          await refreshSession();
          return;
        }

        authDebugLog('Persisted session is fully expired; clearing auth state.');
        clearAuthState();
      })()
        .catch((error) => {
          authDebugLog('Bootstrap failed; clearing auth state.', {
            message: error.message,
            status: error.response?.status,
          });
          clearAuthState();
          console.warn('Failed to restore auth session:', error);
        })
        .finally(() => {
          authDebugLog('Bootstrap promise settled.');
          bootstrapPromiseRef.current = null;
        });
    } else {
      authDebugLog('Reusing in-flight bootstrap auth flow.');
    }

    bootstrapPromiseRef.current.finally(() => {
      if (isActive) {
        authDebugLog('Bootstrap flow finished.');
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
      authDebugLog('Login requested.', { email });
      const response = await authApi.login({
        email,
        password,
        ...getDeviceMetadata(),
      });
      authDebugLog('Login succeeded.', {
        email,
        userId: response.user?.id,
        sessionId: response.session?.id,
        expiresAt: response.expires_at,
      });
      return applyTokenPayload(normalizeTokenPayload(response));
    },
    [applyTokenPayload],
  );

  const logout = useCallback(async () => {
    try {
      if (authState.accessToken) {
        authDebugLog('Logout requested for active session.', {
          sessionId,
        });
        await authApi.logout();
      }
    } finally {
      clearAuthState();
    }
  }, [authState.accessToken, clearAuthState, sessionId]);

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
