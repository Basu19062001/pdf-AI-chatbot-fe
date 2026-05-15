import { useEffect, useRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { persistAuthSession, clearStoredAuthSession } from '../utils/authStorage';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

const refreshMock = vi.fn();
const getMeMock = vi.fn();
const configureApiClientMock = vi.fn();

vi.mock('../services/api/auth', () => ({
  authApi: {
    signup: vi.fn(),
    login: vi.fn(),
    refresh: (...args) => refreshMock(...args),
    getMe: (...args) => getMeMock(...args),
    listSessions: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/api/client', () => ({
  configureApiClient: (...args) => configureApiClientMock(...args),
}));

function AuthProbe() {
  const { isBootstrapping, isAuthenticated, refreshSession, user } = useAuth();
  const hasTriggeredRefreshRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRefreshRef.current) {
      return;
    }

    hasTriggeredRefreshRef.current = true;
    refreshSession();
    refreshSession();
  }, [refreshSession]);

  if (isBootstrapping) {
    return <p>bootstrapping</p>;
  }

  if (isAuthenticated) {
    return <p>ready:{user?.email}</p>;
  }

  return <p>signed-out</p>;
}

describe('AuthProvider', () => {
  afterEach(() => {
    clearStoredAuthSession();
    refreshMock.mockReset();
    getMeMock.mockReset();
    configureApiClientMock.mockReset();
  });

  it('deduplicates overlapping refresh requests', async () => {
    persistAuthSession({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token-1',
      expiresAt: '2000-01-01T00:00:00Z',
      refreshTokenExpiresAt: '2999-01-01T00:00:00Z',
      user: null,
      session: null,
    });

    refreshMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              access_token: 'next-access-token',
              refresh_token: 'refresh-token-2',
              expires_at: '2999-01-01T01:00:00Z',
              refresh_token_expires_at: '2999-01-02T00:00:00Z',
              user: {
                id: '00000000-0000-0000-0000-000000000001',
                full_name: 'Ava Sharma',
                email: 'ava@example.com',
                role: 'user',
                is_active: true,
                created_at: '2026-05-01T00:00:00Z',
                updated_at: '2026-05-01T00:00:00Z',
              },
              session: {
                id: '00000000-0000-0000-0000-000000000010',
                device_id: 'device-1',
                device_name: 'Browser',
                device_type: 'desktop',
                user_agent: 'test-agent',
                ip_address: '127.0.0.1',
                issued_at: '2026-05-01T00:00:00Z',
                expires_at: '2999-01-01T01:00:00Z',
                refresh_expires_at: '2999-01-02T00:00:00Z',
                last_seen_at: '2026-05-01T00:00:00Z',
                created_at: '2026-05-01T00:00:00Z',
                updated_at: '2026-05-01T00:00:00Z',
              },
            });
          }, 25);
        }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ready:ava@example.com')).toBeInTheDocument();
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
