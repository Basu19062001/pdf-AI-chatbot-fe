const GOOGLE_AUTH_RETURN_TO_KEY = 'pdf-chatbot-google-auth-return-to';

const GOOGLE_ERROR_MESSAGES = {
  google_access_denied: 'Google sign-in was cancelled before access was granted.',
  missing_google_code: 'Google did not send an authorization code.',
  invalid_google_state: 'Google sign-in could not be verified. Please try again.',
  missing_google_id_token: 'Google did not return the expected identity token.',
  google_login_failed: 'Google sign-in failed before your workspace could be opened.',
  missing_google_session: 'Google sign-in completed, but no frontend session was returned.',
};

function parseMaybeJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function persistGoogleAuthReturnTo(path) {
  if (!path || !path.startsWith('/')) {
    sessionStorage.removeItem(GOOGLE_AUTH_RETURN_TO_KEY);
    return;
  }

  sessionStorage.setItem(GOOGLE_AUTH_RETURN_TO_KEY, path);
}

export function consumeGoogleAuthReturnTo(fallback = '/app') {
  const value = sessionStorage.getItem(GOOGLE_AUTH_RETURN_TO_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_RETURN_TO_KEY);
  return value && value.startsWith('/') ? value : fallback;
}

export function getGoogleAuthErrorMessage(errorCode) {
  return GOOGLE_ERROR_MESSAGES[errorCode] || 'Unable to finish Google sign-in right now.';
}

export function extractGoogleTokenPayload(locationLike = window.location) {
  const params = new URLSearchParams(locationLike.search || '');
  const hash = (locationLike.hash || '').replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);

  for (const [key, value] of hashParams.entries()) {
    if (!params.has(key)) {
      params.set(key, value);
    }
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: params.get('expires_at'),
    refresh_token_expires_at: params.get('refresh_token_expires_at'),
    user: parseMaybeJson(params.get('user')),
    session: parseMaybeJson(params.get('session')),
  };
}
