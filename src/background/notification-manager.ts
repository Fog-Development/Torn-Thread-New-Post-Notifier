import browser from 'webextension-polyfill';
import { getThreads, updateThreadLastNotified } from '../lib/storage/threads-store.js';
import { formatNotificationTitle } from '../lib/utils/formatters.js';
import { buildThreadUrl } from '../lib/utils/url-parser.js';
import { ThreadCheckResult } from '../lib/models/thread.js';
import { trackCheckResults, shouldNotifyErrors, recordErrorNotification } from '../lib/storage/error-tracker.js';

interface NotificationData {
  type: 'thread-update' | 'error' | 'rate-limit';
  threadId?: number;
  forumId?: number;
  url?: string;
}

export async function handleCheckResults(results: ThreadCheckResult[]): Promise<void> {
  const threads = await getThreads();

  // Send notifications for new posts
  for (const result of results) {
    if (result.success && result.hasNewPosts && result.newPostsCount) {
      const thread = threads.find(t => t.id === result.threadId);
      if (thread) {
        const title = formatNotificationTitle(thread.title, result.newPostsCount);
        const url = buildThreadUrl(thread.id, thread.forum_id);

        await sendNotification(
          `thread-${thread.id}-${Date.now()}`,
          title,
          `Click to view the thread`,
          url,
          { type: 'thread-update', threadId: thread.id, forumId: thread.forum_id, url }
        );

        await updateThreadLastNotified(thread.id);
      }
    }
  }

  // Track errors
  const totalChecks = results.length;
  const failedChecks = results.filter(r => !r.success).length;

  await trackCheckResults(totalChecks, failedChecks);

  // Check if we should notify about errors
  if (await shouldNotifyErrors()) {
    await sendNotification(
      'error-notification',
      'Thread Monitoring Errors',
      `More than 50% of thread checks are failing. Please check your API key and internet connection.`,
      '',
      { type: 'error' }
    );
    await recordErrorNotification();
  }
}

export async function sendNotification(
  id: string,
  title: string,
  message: string,
  url: string,
  data?: NotificationData
): Promise<void> {
  await browser.notifications.create(id, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('assets/icons/icon-128.png'),
    title,
    message,
    priority: 1
  });

  // Store URL for click handling if provided
  if (url || data) {
    await browser.storage.local.set({
      [`notification-${id}`]: { url, data }
    });
  }
}

export async function handleNotificationClick(notificationId: string): Promise<void> {
  // Get notification data
  const result = await browser.storage.local.get(`notification-${notificationId}`);
  const notificationData = result[`notification-${notificationId}`] as { url?: string; data?: NotificationData } | undefined;

  if (notificationData?.url) {
    // Open URL in new tab
    await browser.tabs.create({ url: notificationData.url });
  }

  // Clear notification
  await browser.notifications.clear(notificationId);
  await browser.storage.local.remove(`notification-${notificationId}`);
}
