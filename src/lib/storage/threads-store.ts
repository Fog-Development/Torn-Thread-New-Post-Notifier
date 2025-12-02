import browser from 'webextension-polyfill';
import { MonitoredThread } from '../models/thread.js';

const THREADS_KEY = 'monitored_threads';

export async function getThreads(): Promise<MonitoredThread[]> {
  try {
    const result = await browser.storage.local.get(THREADS_KEY);
    return (result[THREADS_KEY] as MonitoredThread[]) || [];
  } catch (error) {
    console.error('Error loading threads:', error);
    return [];
  }
}

export async function addThread(thread: MonitoredThread): Promise<void> {
  const threads = await getThreads();

  // Check for duplicate
  if (threads.some(t => t.id === thread.id)) {
    throw new Error('Thread is already being monitored');
  }

  threads.push(thread);
  await saveThreads(threads);
}

export async function removeThread(threadId: number): Promise<void> {
  const threads = await getThreads();
  const filtered = threads.filter(t => t.id !== threadId);
  await saveThreads(filtered);
}

export async function removeAllThreads(): Promise<void> {
  await saveThreads([]);
}

export async function updateThreadPostCount(threadId: number, posts: number, lastPostTime?: number | null): Promise<void> {
  const threads = await getThreads();
  const thread = threads.find(t => t.id === threadId);

  if (thread) {
    thread.totalPosts = posts;
    thread.lastCheckedPosts = posts;
    thread.lastChecked = Date.now();

    // Update lastPostTime if provided (API returns Unix timestamp in seconds, convert to milliseconds)
    if (lastPostTime !== null && lastPostTime !== undefined) {
      thread.lastPostTime = lastPostTime * 1000;
    }

    await saveThreads(threads);
  }
}

export async function updateThreadLastNotified(threadId: number): Promise<void> {
  const threads = await getThreads();
  const thread = threads.find(t => t.id === threadId);

  if (thread) {
    thread.lastNotified = Date.now();
    await saveThreads(threads);
  }
}

export async function resetThreadCounts(): Promise<void> {
  const threads = await getThreads();
  threads.forEach(thread => {
    thread.lastCheckedPosts = thread.totalPosts;
  });
  await saveThreads(threads);
}

async function saveThreads(threads: MonitoredThread[]): Promise<void> {
  try {
    await browser.storage.local.set({ [THREADS_KEY]: threads });
  } catch (error) {
    console.error('Error saving threads:', error);
    // Check if quota exceeded
    if (error instanceof Error && error.message.includes('QUOTA')) {
      throw new Error('Storage quota exceeded. Try removing some threads.');
    }
    throw error;
  }
}
