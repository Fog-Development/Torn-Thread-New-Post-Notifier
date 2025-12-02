import { getSettings } from '../lib/storage/settings-store.js';
import { getThreads, updateThreadPostCount } from '../lib/storage/threads-store.js';
import { getThreadDetails } from '../lib/api/endpoints.js';
import { applyDelay, calculateApiUsage } from '../lib/api/rate-limiter.js';
import { ApiError } from '../lib/api/torn-api.js';
import { ThreadCheckResult } from '../lib/models/thread.js';
import { updateDelay } from '../lib/storage/settings-store.js';
import { sendNotification } from './notification-manager.js';

export async function checkAllThreads(): Promise<ThreadCheckResult[]> {
  const settings = await getSettings();
  const threads = await getThreads();

  if (!settings.apiKeyValid || !settings.apiKey) {
    console.log('API key not valid, skipping thread checks');
    return [];
  }

  if (threads.length === 0) {
    console.log('No threads to monitor');
    return [];
  }

  // Check if we need to auto-adjust delay
  const usage = calculateApiUsage(
    threads.length,
    settings.checkFrequencyMinutes,
    settings.delayBetweenChecksSeconds
  );

  if (usage.recommendedCooldown && usage.recommendedCooldown > settings.delayBetweenChecksSeconds) {
    console.log(`Auto-adjusting cooldown from ${settings.delayBetweenChecksSeconds}s to ${usage.recommendedCooldown}s`);
    await updateDelay(usage.recommendedCooldown);

    // Notify user of auto-adjustment
    await sendNotification(
      'rate-limit-auto-adjust',
      'API Rate Limit Auto-Adjustment',
      `Cooldown increased to ${usage.recommendedCooldown}s to stay under 80 requests/minute.`,
      ''
    );
  }

  const results: ThreadCheckResult[] = [];

  for (const thread of threads) {
    try {
      console.log(`[DEBUG] Checking thread ${thread.id} (${thread.title})`);
      console.log(`[DEBUG] Stored lastCheckedPosts: ${thread.lastCheckedPosts}, totalPosts: ${thread.totalPosts}`);

      const threadDetails = await getThreadDetails(settings.apiKey, thread.id);
      const currentPosts = threadDetails.posts;
      const lastPostTime = threadDetails.last_post_time;

      console.log(`[DEBUG] API returned currentPosts: ${currentPosts} (type: ${typeof currentPosts})`);
      console.log(`[DEBUG] Comparison: ${currentPosts} > ${thread.lastCheckedPosts} = ${currentPosts > thread.lastCheckedPosts}`);

      const hasNewPosts = currentPosts > thread.lastCheckedPosts;

      const result: ThreadCheckResult = {
        threadId: thread.id,
        success: true,
        currentPosts,
        previousPosts: thread.lastCheckedPosts,
        hasNewPosts,
        newPostsCount: hasNewPosts ? currentPosts - thread.lastCheckedPosts : 0
      };

      results.push(result);

      // Update stored post count and last post time
      await updateThreadPostCount(thread.id, currentPosts, lastPostTime);

      console.log(`Checked thread ${thread.id}: ${currentPosts} posts (${hasNewPosts ? '+' + result.newPostsCount : 'no change'})`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      results.push({
        threadId: thread.id,
        success: false,
        previousPosts: thread.lastCheckedPosts,
        hasNewPosts: false,
        error: errorMessage
      });

      console.error(`Error checking thread ${thread.id}:`, errorMessage);

      // Handle specific API errors
      if (error instanceof ApiError && error.isNotFound()) {
        console.log(`Thread ${thread.id} not found, may have been deleted`);
      }
    }

    // Apply delay between checks (except for last thread)
    if (threads.indexOf(thread) < threads.length - 1) {
      await applyDelay(settings.delayBetweenChecksSeconds);
    }
  }

  return results;
}
