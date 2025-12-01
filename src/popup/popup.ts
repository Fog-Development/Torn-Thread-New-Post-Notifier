import { initializeSettingsModal, showSettingsIfNeeded } from './components/settings-modal.js';
import { renderThreadList } from './components/thread-list.js';
import { updateApiUsageStats } from './components/stats-display.js';
import { getSettings, updateThreadSortOrder, updateLastCheckTimestamp } from '../lib/storage/settings-store.js';
import { addThread, removeAllThreads } from '../lib/storage/threads-store.js';
import { getSubscribedThreads, getThreadDetails } from '../lib/api/endpoints.js';
import { parseThreadId } from '../lib/utils/url-parser.js';
import { MonitoredThread } from '../lib/models/thread.js';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');

  // Initialize components
  await initializeSettingsModal();
  await renderThreadList();
  await updateApiUsageStats();

  // Setup event listeners
  setupEventListeners();

  // Initialize sort toggle state
  await initializeSortToggle();

  // Show settings if no API key
  await showSettingsIfNeeded();
});

function setupEventListeners(): void {
  // Add Thread Button
  const addThreadBtn = document.getElementById('addThreadBtn') as HTMLButtonElement;
  const addThreadForm = document.getElementById('addThreadForm') as HTMLDivElement;
  const cancelAddBtn = document.getElementById('cancelAddBtn') as HTMLButtonElement;
  const confirmAddBtn = document.getElementById('confirmAddBtn') as HTMLButtonElement;

  addThreadBtn?.addEventListener('click', () => {
    addThreadForm?.classList.remove('hidden');
    addThreadBtn.classList.add('hidden');
  });

  cancelAddBtn?.addEventListener('click', () => {
    addThreadForm?.classList.add('hidden');
    addThreadBtn?.classList.remove('hidden');
    const input = document.getElementById('threadUrlInput') as HTMLInputElement;
    if (input) input.value = '';
    hideAddThreadError();
  });

  confirmAddBtn?.addEventListener('click', handleAddThread);

  // Import Subscribed Button
  const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
  importBtn?.addEventListener('click', handleImportSubscribed);

  // Delete All Button
  const deleteAllBtn = document.getElementById('deleteAllBtn') as HTMLButtonElement;
  deleteAllBtn?.addEventListener('click', handleDeleteAll);

  // Enter key in thread URL input
  const threadUrlInput = document.getElementById('threadUrlInput') as HTMLInputElement;
  threadUrlInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddThread();
    }
  });

  // Sort toggle buttons
  const sortNewestBtn = document.getElementById('sortNewestBtn') as HTMLButtonElement;
  const sortOldestBtn = document.getElementById('sortOldestBtn') as HTMLButtonElement;

  sortNewestBtn?.addEventListener('click', () => handleSortChange('newest'));
  sortOldestBtn?.addEventListener('click', () => handleSortChange('oldest'));
}

async function handleAddThread(): Promise<void> {
  const input = document.getElementById('threadUrlInput') as HTMLInputElement;
  const url = input.value.trim();

  if (!url) {
    showAddThreadError('Please enter a thread URL');
    return;
  }

  // Parse thread ID from URL
  const threadId = parseThreadId(url);

  if (!threadId) {
    showAddThreadError('Invalid thread URL. Make sure it contains a thread ID (t= parameter)');
    return;
  }

  // Get API key
  const settings = await getSettings();

  if (!settings.apiKeyValid || !settings.apiKey) {
    showAddThreadError('Please set up a valid API key in settings first');
    return;
  }

  // Fetch thread details
  try {
    const confirmBtn = document.getElementById('confirmAddBtn') as HTMLButtonElement;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Adding...';

    const threadDetails = await getThreadDetails(settings.apiKey, threadId);

    const monitoredThread: MonitoredThread = {
      id: threadDetails.id,
      title: threadDetails.title,
      forum_id: threadDetails.forum_id,
      totalPosts: threadDetails.posts,
      lastCheckedPosts: threadDetails.posts,
      addedAt: Date.now(),
      lastPostTime: threadDetails.last_post_time ? threadDetails.last_post_time * 1000 : undefined
    };

    await addThread(monitoredThread);

    // Initialize lastCheckTimestamp to prevent false positives on first check
    await updateLastCheckTimestamp(Date.now());

    // Reset form
    input.value = '';
    const addThreadForm = document.getElementById('addThreadForm') as HTMLDivElement;
    const addThreadBtn = document.getElementById('addThreadBtn') as HTMLButtonElement;
    addThreadForm?.classList.add('hidden');
    addThreadBtn?.classList.remove('hidden');
    hideAddThreadError();

    // Refresh thread list
    await renderThreadList();
    await updateApiUsageStats();

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already being monitored')) {
        showAddThreadError('This thread is already being monitored');
      } else {
        showAddThreadError(`Failed to add thread: ${error.message}`);
      }
    }
  } finally {
    const confirmBtn = document.getElementById('confirmAddBtn') as HTMLButtonElement;
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Add';
  }
}

async function handleImportSubscribed(): Promise<void> {
  const settings = await getSettings();

  if (!settings.apiKeyValid || !settings.apiKey) {
    alert('Please set up a valid API key in settings first');
    return;
  }

  try {
    const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    const subscribedThreads = await getSubscribedThreads(settings.apiKey);

    // Validate we actually got an array
    if (!Array.isArray(subscribedThreads)) {
      console.error('subscribedThreads is not an array:', typeof subscribedThreads, subscribedThreads);
      throw new Error(`Expected array of threads, got ${typeof subscribedThreads}`);
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const thread of subscribedThreads) {
      try {
        const monitoredThread: MonitoredThread = {
          id: thread.id,
          title: thread.title,
          forum_id: thread.forum_id,
          totalPosts: thread.posts.total,
          lastCheckedPosts: thread.posts.total,
          addedAt: Date.now()
        };

        await addThread(monitoredThread);
        addedCount++;
      } catch (error) {
        // Check if this is a quota error (don't continue if so)
        if (error instanceof Error && error.message.includes('quota')) {
          throw error;
        }
        // Thread already exists, skip
        skippedCount++;
      }
    }

    // Initialize lastCheckTimestamp if threads were added to prevent false positives on first check
    if (addedCount > 0) {
      await updateLastCheckTimestamp(Date.now());
    }

    // Show result
    if (addedCount > 0) {
      alert(`Successfully imported ${addedCount} thread${addedCount > 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} already monitored)` : ''}`);
    } else if (skippedCount > 0) {
      alert('All subscribed threads are already being monitored');
    } else {
      alert('No subscribed threads found');
    }

    // Refresh thread list
    await renderThreadList();
    await updateApiUsageStats();

  } catch (error) {
    alert(`Failed to import threads: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    importBtn.disabled = false;
    importBtn.textContent = 'Import Subscribed';
  }
}

function showAddThreadError(message: string): void {
  const errorDiv = document.getElementById('addThreadError') as HTMLDivElement;
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideAddThreadError(): void {
  const errorDiv = document.getElementById('addThreadError') as HTMLDivElement;
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

async function handleDeleteAll(): Promise<void> {
  if (confirm('Are you sure you want to delete all monitored threads? This action cannot be undone.')) {
    await removeAllThreads();
    await renderThreadList();
    await updateApiUsageStats();
  }
}

async function initializeSortToggle(): Promise<void> {
  const settings = await getSettings();
  updateSortToggleUI(settings.threadSortOrder);
}

async function handleSortChange(sortOrder: 'newest' | 'oldest'): Promise<void> {
  await updateThreadSortOrder(sortOrder);
  updateSortToggleUI(sortOrder);
  await renderThreadList();
}

function updateSortToggleUI(sortOrder: 'newest' | 'oldest'): void {
  const sortNewestBtn = document.getElementById('sortNewestBtn') as HTMLButtonElement;
  const sortOldestBtn = document.getElementById('sortOldestBtn') as HTMLButtonElement;

  if (sortOrder === 'newest') {
    sortNewestBtn?.classList.add('active');
    sortOldestBtn?.classList.remove('active');
  } else {
    sortNewestBtn?.classList.remove('active');
    sortOldestBtn?.classList.add('active');
  }
}
