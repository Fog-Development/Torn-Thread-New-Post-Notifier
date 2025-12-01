import { getSettings, updateLastCheckTimestamp } from '../lib/storage/settings-store.js';
import { resetThreadCounts } from '../lib/storage/threads-store.js';

const ALARM_NAME = 'thread-check-alarm';
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function initializeAlarm(): Promise<void> {
  const settings = await getSettings();
  await createAlarm(settings.checkFrequencyMinutes);
}

export async function createAlarm(frequencyMinutes: number): Promise<void> {
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_NAME);

  // Create new alarm with specified frequency
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: frequencyMinutes,
    periodInMinutes: frequencyMinutes
  });

  console.log(`Alarm created: checking every ${frequencyMinutes} minutes`);
}

export async function handleAlarmTrigger(): Promise<boolean> {
  const settings = await getSettings();

  // Handle restart behavior
  // Only apply fresh start logic if lastCheckTimestamp exists (not first run)
  if (settings.restartBehavior === 'fresh' && settings.lastCheckTimestamp !== undefined) {
    const timeSinceLastCheck = Date.now() - settings.lastCheckTimestamp;

    // If more than 1 hour since last check, reset counts
    if (timeSinceLastCheck > ONE_HOUR_MS) {
      console.log('Fresh start: resetting thread counts (>1 hour since last check)');
      await resetThreadCounts();
    }
  }

  // Update last check timestamp
  await updateLastCheckTimestamp(Date.now());

  return true;
}

export async function updateAlarmFrequency(frequencyMinutes: number): Promise<void> {
  await createAlarm(frequencyMinutes);
}
