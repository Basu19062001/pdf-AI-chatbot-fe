function formatValidationLocation(location) {
  if (!Array.isArray(location) || location.length === 0) {
    return '';
  }

  return location
    .filter((part) => part !== 'body' && part !== 'query' && part !== 'path')
    .map((part) => String(part).replace(/_/g, ' '))
    .join(' ');
}

function formatDetailItem(item) {
  if (typeof item === 'string' && item.trim()) {
    return item.trim();
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  const message = typeof item.msg === 'string' ? item.msg.trim() : '';
  if (!message) {
    return '';
  }

  const location = formatValidationLocation(item.loc);
  return location ? `${location}: ${message}` : message;
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const responseData = error?.response?.data;
  const responseDetail = responseData?.detail;

  if (typeof responseDetail === 'string' && responseDetail.trim()) {
    return responseDetail.trim();
  }

  if (Array.isArray(responseDetail) && responseDetail.length > 0) {
    const messages = responseDetail.map(formatDetailItem).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (responseDetail && typeof responseDetail === 'object') {
    const detailMessage = firstNonEmptyString(responseDetail.message, responseDetail.msg, responseDetail.error);
    if (detailMessage) {
      return detailMessage;
    }
  }

  const responseMessage = firstNonEmptyString(responseData?.message, responseData?.error);
  if (responseMessage) {
    return responseMessage;
  }

  const errorMessage = firstNonEmptyString(error?.message);
  if (errorMessage) {
    return errorMessage;
  }

  return fallback;
}
