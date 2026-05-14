export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const responseDetail = error?.response?.data?.detail;

  if (typeof responseDetail === 'string' && responseDetail.trim()) {
    return responseDetail;
  }

  if (Array.isArray(responseDetail) && responseDetail.length > 0) {
    const firstItem = responseDetail[0];
    if (typeof firstItem?.msg === 'string') {
      return firstItem.msg;
    }
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

