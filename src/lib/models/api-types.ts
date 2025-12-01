// Based on Torn API v2 OpenAPI schema

export interface ForumSubscribedThreadsResponse {
  forumSubscribedThreads: ForumSubscribedThread[];
}

export interface ForumSubscribedThread {
  id: number;
  forum_id: number;
  author: ForumThreadAuthor;
  title: string;
  posts: {
    new: number;
    total: number;
  };
}

export interface ForumThreadResponse {
  thread: ForumThreadExtended;
}

export interface ForumThreadExtended {
  id: number;
  title: string;
  forum_id: number;
  posts: number; // Total post count
  rating: number;
  views: number;
  author: ForumThreadAuthor;
  last_poster: ForumThreadAuthor | null;
  first_post_time: number;
  last_post_time: number | null;
  has_poll: boolean;
  is_locked: boolean;
  is_sticky: boolean;
  content: string;
  content_raw: string;
  poll: ForumPoll | null;
}

export interface ForumThreadAuthor {
  id: number;
  username: string;
  karma: number;
}

export interface ForumPoll {
  question: string;
  votes: number;
  options: ForumPollOption[];
}

export interface ForumPollOption {
  id: number;
  option: string;
  votes: number;
}

export interface TornApiError {
  error: {
    code: number;
    error: string;
  };
}

// API Error Codes
export enum TornApiErrorCode {
  UNKNOWN = 0,
  KEY_EMPTY = 1,
  KEY_INVALID = 2,
  WRONG_TYPE = 3,
  WRONG_FIELDS = 4,
  TOO_MANY_REQUESTS = 5,
  INCORRECT_ID = 6,
  INCORRECT_ID_TYPE = 7,
  IP_BLOCK = 8,
  API_DISABLED = 9,
  PLAYER_IP_BLOCK = 10,
  KEY_CHANGE_ERROR = 11,
  KEY_READ_ERROR = 12,
  BACKEND_ERROR = 13,
  API_KEY_DISABLED = 14
}
