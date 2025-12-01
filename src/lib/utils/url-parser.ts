export function parseThreadId(url: string): number | null {
  try {
    // Try to extract t= parameter from URL
    const urlObj = new URL(url);

    // Check query string
    const tParam = urlObj.searchParams.get('t');
    if (tParam) {
      const threadId = parseInt(tParam, 10);
      return isNaN(threadId) ? null : threadId;
    }

    // Check hash fragment (for URLs like #/p=threads&f=46&t=15907925)
    const hash = urlObj.hash;
    if (hash) {
      const tMatch = hash.match(/[?&]t=(\d+)/);
      if (tMatch) {
        const threadId = parseInt(tMatch[1], 10);
        return isNaN(threadId) ? null : threadId;
      }
    }

    return null;
  } catch (error) {
    // If URL parsing fails, try regex as fallback
    const match = url.match(/[?&#]t=(\d+)/);
    if (match) {
      const threadId = parseInt(match[1], 10);
      return isNaN(threadId) ? null : threadId;
    }
    return null;
  }
}

export function buildThreadUrl(threadId: number, forumId: number): string {
  return `https://www.torn.com/forums.php#/p=threads&f=${forumId}&t=${threadId}`;
}
