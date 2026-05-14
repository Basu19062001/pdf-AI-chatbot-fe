const DEVICE_ID_KEY = 'pdf-chatbot-device-id';

function ensureDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `device-${Date.now()}`;

  localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function inferDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(userAgent)) {
    return 'tablet';
  }

  if (/mobi|android|iphone/.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
}

function buildDeviceName() {
  const platform = navigator.platform || 'Unknown Platform';
  const language = navigator.language || 'en-US';
  return `${platform} · ${language}`;
}

export function getDeviceMetadata() {
  return {
    device_id: ensureDeviceId(),
    device_name: buildDeviceName(),
    device_type: inferDeviceType(),
  };
}

