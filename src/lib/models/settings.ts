export interface ExtensionSettings {
  apiKey: string;
  apiKeyValid: boolean;
  apiKeyError?: string;
  checkFrequencyMinutes: number; // 1-120, default 5
  delayBetweenChecksSeconds: number; // 0.1-3.0, default 0.5
  restartBehavior: 'continue' | 'fresh'; // continue or fresh start
  threadSortOrder: 'newest' | 'oldest'; // Sort threads by last post time
  lastCheckTimestamp?: number;
  lastValidationTimestamp?: number;
}

export interface ApiUsageStats {
  requestsPerMinute: number;
  warningLevel: 'none' | 'yellow' | 'red'; // <25, 25-49, 50+
  recommendedCooldown?: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: '',
  apiKeyValid: false,
  checkFrequencyMinutes: 5,
  delayBetweenChecksSeconds: 0.5,
  restartBehavior: 'continue',
  threadSortOrder: 'newest'
};
