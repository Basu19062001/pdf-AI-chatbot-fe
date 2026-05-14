import {
  clearStoredAuthSession,
  getStoredAuthSession,
  isTimestampExpired,
  persistAuthSession,
} from './authStorage';

describe('authStorage', () => {
  afterEach(() => {
    clearStoredAuthSession();
  });

  it('persists and restores auth state', () => {
    const payload = {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: '2030-01-01T00:00:00Z',
      refreshTokenExpiresAt: '2030-01-02T00:00:00Z',
      user: { email: 'ava@example.com' },
      session: { id: 'session-1' },
    };

    persistAuthSession(payload);

    expect(getStoredAuthSession()).toEqual(payload);
  });

  it('marks past timestamps as expired', () => {
    expect(isTimestampExpired('2000-01-01T00:00:00Z')).toBe(true);
  });

  it('treats future timestamps as active', () => {
    expect(isTimestampExpired('2999-01-01T00:00:00Z')).toBe(false);
  });
});

