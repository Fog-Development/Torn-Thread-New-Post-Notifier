import { getSettings } from '../../lib/storage/settings-store.js';
import { getThreads } from '../../lib/storage/threads-store.js';
import { calculateApiUsage } from '../../lib/api/rate-limiter.js';

export async function updateApiUsageStats(): Promise<void> {
  const settings = await getSettings();
  const threads = await getThreads();

  const usage = calculateApiUsage(
    threads.length,
    settings.checkFrequencyMinutes,
    settings.delayBetweenChecksSeconds
  );

  const statsValue = document.getElementById('statsValue') as HTMLDivElement;
  const statsWarning = document.getElementById('statsWarning') as HTMLDivElement;

  if (!statsValue || !statsWarning) return;

  // Update value
  statsValue.textContent = threads.length === 0
    ? '0 requests/min'
    : `${usage.requestsPerMinute.toFixed(1)} requests/min`;

  // Update warning
  statsWarning.classList.remove('yellow', 'red');

  if (usage.warningLevel === 'yellow') {
    statsWarning.classList.remove('hidden');
    statsWarning.classList.add('yellow');
    statsWarning.textContent = '⚠ API usage is approaching higher levels (25+ req/min)';
  } else if (usage.warningLevel === 'red') {
    statsWarning.classList.remove('hidden');
    statsWarning.classList.add('red');
    statsWarning.textContent = '⚠ High API usage detected (50+ req/min). Consider reducing frequency or monitored threads.';
  } else {
    statsWarning.classList.add('hidden');
  }

  // Show auto-adjust recommendation
  if (usage.recommendedCooldown) {
    statsWarning.classList.remove('hidden');
    statsWarning.classList.add('red');
    statsWarning.textContent = `⚠ API usage will exceed 80 req/min. Cooldown will auto-adjust to ${usage.recommendedCooldown}s when next check runs.`;
  }
}
