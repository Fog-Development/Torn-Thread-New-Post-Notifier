export function isValidApiKey(apiKey: string): boolean {
  // Torn API keys are 16 alphanumeric characters
  return /^[a-zA-Z0-9]{16}$/.test(apiKey);
}

export function isValidThreadId(threadId: number): boolean {
  return Number.isInteger(threadId) && threadId > 0;
}

export function isValidCheckFrequency(minutes: number): boolean {
  return Number.isFinite(minutes) && minutes >= 1 && minutes <= 120;
}

export function isValidDelay(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds >= 0.1 && seconds <= 3.0;
}
