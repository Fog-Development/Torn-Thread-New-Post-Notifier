import { ApiUsageStats } from '../models/settings.js';

export function calculateApiUsage(
  threadCount: number,
  checkFrequencyMinutes: number,
  _delaySeconds: number
): ApiUsageStats {
  if (threadCount === 0) {
    return {
      requestsPerMinute: 0,
      warningLevel: 'none'
    };
  }

  // Calculate requests per minute
  // Each check cycle makes threadCount API calls
  // Cycles per hour = 60 / checkFrequencyMinutes
  // Total requests per hour = threadCount * (60 / checkFrequencyMinutes)
  // Requests per minute = Total requests per hour / 60
  const requestsPerMinute = (threadCount * 60) / (checkFrequencyMinutes * 60);

  // Determine warning level
  let warningLevel: 'none' | 'yellow' | 'red';
  if (requestsPerMinute >= 50) {
    warningLevel = 'red';
  } else if (requestsPerMinute >= 25) {
    warningLevel = 'yellow';
  } else {
    warningLevel = 'none';
  }

  // Calculate recommended cooldown if over 80 req/min
  let recommendedCooldown: number | undefined;
  if (requestsPerMinute >= 80) {
    // We need to increase delay to bring it under 80 req/min
    // Target: threadCount calls should take long enough that we stay under 80/min
    // If we check every checkFrequencyMinutes, we make threadCount calls
    // Time available per check cycle = checkFrequencyMinutes * 60 seconds
    // To stay under 80 req/min, we need: (threadCount / (checkFrequencyMinutes * 60)) * 60 < 80
    // Solving for delay: delay = (threadCount / 80) * 60 / checkFrequencyMinutes

    const targetDelay = ((threadCount * checkFrequencyMinutes) / 80) / threadCount;
    recommendedCooldown = Math.max(0.1, Math.ceil(targetDelay * 10) / 10);
  }

  return {
    requestsPerMinute,
    warningLevel,
    recommendedCooldown
  };
}

export async function applyDelay(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
