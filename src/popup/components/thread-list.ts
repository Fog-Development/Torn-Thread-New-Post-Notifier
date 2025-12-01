import { getThreads, removeThread } from '../../lib/storage/threads-store.js';
import { truncateTitle, formatRelativeTime } from '../../lib/utils/formatters.js';
import { buildThreadUrl } from '../../lib/utils/url-parser.js';
import { updateApiUsageStats } from './stats-display.js';
import { getSettings } from '../../lib/storage/settings-store.js';
import { MonitoredThread } from '../../lib/models/thread.js';

export async function renderThreadList(): Promise<void> {
  const threads = await getThreads();
  const settings = await getSettings();
  const threadList = document.getElementById('threadList') as HTMLDivElement;
  const emptyState = document.getElementById('emptyState') as HTMLDivElement;
  const threadListHeader = document.getElementById('threadListHeader') as HTMLDivElement;

  if (!threadList) return;

  if (threads.length === 0) {
    emptyState?.classList.remove('hidden');
    threadListHeader?.classList.add('hidden');
    // Clear any existing thread items
    const existingItems = threadList.querySelectorAll('.thread-item');
    existingItems.forEach(item => item.remove());
    return;
  }

  emptyState?.classList.add('hidden');
  threadListHeader?.classList.remove('hidden');

  // Clear existing items
  const existingItems = threadList.querySelectorAll('.thread-item');
  existingItems.forEach(item => item.remove());

  // Sort threads
  const sortedThreads = sortThreads(threads, settings.threadSortOrder);

  // Render threads
  sortedThreads.forEach(thread => {
    const threadItem = createThreadItem(thread);
    threadList.appendChild(threadItem);
  });
}

function sortThreads(threads: MonitoredThread[], sortOrder: 'newest' | 'oldest'): MonitoredThread[] {
  return [...threads].sort((a, b) => {
    // If both have lastPostTime, sort by it
    if (a.lastPostTime && b.lastPostTime) {
      return sortOrder === 'newest'
        ? b.lastPostTime - a.lastPostTime
        : a.lastPostTime - b.lastPostTime;
    }

    // If only one has lastPostTime, prioritize it
    if (a.lastPostTime && !b.lastPostTime) return -1;
    if (!a.lastPostTime && b.lastPostTime) return 1;

    // If neither has lastPostTime, sort alphabetically by title
    return a.title.localeCompare(b.title);
  });
}

function createThreadItem(thread: MonitoredThread): HTMLElement {
  const item = document.createElement('div');
  item.className = 'thread-item';

  const info = document.createElement('div');
  info.className = 'thread-info';

  const titleLink = document.createElement('a');
  titleLink.className = 'thread-title';
  titleLink.href = buildThreadUrl(thread.id, thread.forum_id);
  titleLink.target = '_blank';
  titleLink.textContent = truncateTitle(thread.title);
  titleLink.title = thread.title; // Full title on hover

  const meta = document.createElement('div');
  meta.className = 'thread-meta';

  // Build meta information
  const metaParts: string[] = [];
  metaParts.push(`${thread.totalPosts} posts`);

  if (thread.lastChecked) {
    metaParts.push(`Last checked ${formatRelativeTime(thread.lastChecked)}`);
  } else {
    metaParts.push('Never checked');
  }

  if (thread.lastPostTime) {
    metaParts.push(`Last post ${formatRelativeTime(thread.lastPostTime)}`);
  }

  meta.textContent = metaParts.join(' • ');

  info.appendChild(titleLink);
  info.appendChild(meta);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M14 5L4 15M4 5L14 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
  deleteBtn.setAttribute('aria-label', 'Delete thread');
  deleteBtn.addEventListener('click', async () => {
    await handleDeleteThread(thread.id);
  });

  item.appendChild(info);
  item.appendChild(deleteBtn);

  return item;
}

async function handleDeleteThread(threadId: number): Promise<void> {
  if (confirm('Are you sure you want to stop monitoring this thread?')) {
    await removeThread(threadId);
    await renderThreadList();
    await updateApiUsageStats();
  }
}
