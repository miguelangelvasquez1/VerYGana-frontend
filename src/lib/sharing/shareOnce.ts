let isSharePending = false;

export async function shareOnce(share: () => Promise<void>): Promise<boolean> {
  if (isSharePending) return false;

  isSharePending = true;
  try {
    await share();
    return true;
  } finally {
    isSharePending = false;
  }
}
