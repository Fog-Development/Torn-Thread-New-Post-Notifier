export function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength - 3) + '...';
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function formatPostCount(count: number, previousCount?: number): string {
  if (previousCount !== undefined && count > previousCount) {
    const newPosts = count - previousCount;
    return `${newPosts} new post${newPosts > 1 ? 's' : ''}`;
  }
  return `${count} post${count !== 1 ? 's' : ''}`;
}

export function formatNotificationTitle(threadTitle: string, newPostCount: number): string {
  return `${newPostCount} new post${newPostCount > 1 ? 's' : ''} on Thread "${threadTitle}"`;
}
