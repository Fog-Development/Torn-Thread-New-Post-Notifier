import { ExtensionSettings, DEFAULT_SETTINGS } from '../models/settings.js';

const SETTINGS_KEY = 'extension_settings';

export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.sync.get(SETTINGS_KEY);
    if (result[SETTINGS_KEY]) {
      return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    // Check if quota exceeded
    if (error instanceof Error && error.message.includes('QUOTA')) {
      throw new Error('Storage quota exceeded. Please contact support.');
    }
    throw error;
  }
}

export async function updateApiKey(apiKey: string, isValid: boolean, error?: string): Promise<void> {
  const settings = await getSettings();
  settings.apiKey = apiKey;
  settings.apiKeyValid = isValid;
  settings.apiKeyError = error;
  settings.lastValidationTimestamp = Date.now();
  await saveSettings(settings);
}

export async function updateCheckFrequency(minutes: number): Promise<void> {
  const settings = await getSettings();
  settings.checkFrequencyMinutes = Math.max(1, Math.min(120, minutes));
  await saveSettings(settings);
}

export async function updateDelay(seconds: number): Promise<void> {
  const settings = await getSettings();
  settings.delayBetweenChecksSeconds = Math.max(0.1, Math.min(3.0, seconds));
  await saveSettings(settings);
}

export async function updateRestartBehavior(behavior: 'continue' | 'fresh'): Promise<void> {
  const settings = await getSettings();
  settings.restartBehavior = behavior;
  await saveSettings(settings);
}

export async function updateLastCheckTimestamp(timestamp: number): Promise<void> {
  const settings = await getSettings();
  settings.lastCheckTimestamp = timestamp;
  await saveSettings(settings);
}

export async function updateThreadSortOrder(sortOrder: 'newest' | 'oldest'): Promise<void> {
  const settings = await getSettings();
  settings.threadSortOrder = sortOrder;
  await saveSettings(settings);
}
