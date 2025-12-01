const ERROR_HISTORY_KEY = 'error_history';
const LAST_ERROR_NOTIFICATION_KEY = 'last_error_notification';
const ERROR_NOTIFICATION_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

interface CheckCycle {
  timestamp: number;
  totalChecks: number;
  failedChecks: number;
}

export async function trackCheckResults(totalChecks: number, failedChecks: number): Promise<void> {
  const history = await getErrorHistory();

  const cycle: CheckCycle = {
    timestamp: Date.now(),
    totalChecks,
    failedChecks
  };

  // Keep only last 3 cycles
  history.push(cycle);
  if (history.length > 3) {
    history.shift();
  }

  await saveErrorHistory(history);
}

export async function shouldNotifyErrors(): Promise<boolean> {
  const history = await getErrorHistory();

  // Need at least 1 cycle to evaluate
  if (history.length === 0) {
    return false;
  }

  // Calculate failure rate over last 3 cycles
  let totalChecks = 0;
  let totalFailures = 0;

  history.forEach(cycle => {
    totalChecks += cycle.totalChecks;
    totalFailures += cycle.failedChecks;
  });

  if (totalChecks === 0) {
    return false;
  }

  const failureRate = totalFailures / totalChecks;

  // Check if failure rate exceeds 50%
  if (failureRate <= 0.5) {
    return false;
  }

  // Check throttle
  const lastNotification = await getLastErrorNotification();
  if (lastNotification && Date.now() - lastNotification < ERROR_NOTIFICATION_THROTTLE_MS) {
    return false;
  }

  return true;
}

export async function recordErrorNotification(): Promise<void> {
  await chrome.storage.local.set({ [LAST_ERROR_NOTIFICATION_KEY]: Date.now() });
}

async function getErrorHistory(): Promise<CheckCycle[]> {
  try {
    const result = await chrome.storage.local.get(ERROR_HISTORY_KEY);
    return result[ERROR_HISTORY_KEY] || [];
  } catch (error) {
    console.error('Error loading error history:', error);
    return [];
  }
}

async function saveErrorHistory(history: CheckCycle[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [ERROR_HISTORY_KEY]: history });
  } catch (error) {
    console.error('Error saving error history:', error);
  }
}

async function getLastErrorNotification(): Promise<number | null> {
  try {
    const result = await chrome.storage.local.get(LAST_ERROR_NOTIFICATION_KEY);
    return result[LAST_ERROR_NOTIFICATION_KEY] || null;
  } catch (error) {
    console.error('Error loading last error notification time:', error);
    return null;
  }
}
