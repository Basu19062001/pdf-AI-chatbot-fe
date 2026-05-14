const AUTH_STORAGE_KEY = 'pdf-chatbot-auth-session';

export function persistAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAuthSession() {
  const value = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isTimestampExpired(value, thresholdInSeconds = 0) {
  if (!value) {
    return true;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return timestamp <= Date.now() + thresholdInSeconds * 1000;
}

