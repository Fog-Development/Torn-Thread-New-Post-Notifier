export interface MonitoredThread {
  id: number;
  title: string;
  forum_id: number;
  totalPosts: number;
  lastCheckedPosts: number;
  addedAt: number; // timestamp
  lastChecked?: number; // timestamp
  lastNotified?: number; // timestamp
  lastPostTime?: number; // timestamp of the last post in the thread
}

export interface ThreadCheckResult {
  threadId: number;
  success: boolean;
  currentPosts?: number;
  previousPosts: number;
  hasNewPosts: boolean;
  newPostsCount?: number;
  error?: string;
}
