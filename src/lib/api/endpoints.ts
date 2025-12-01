import { TornApiClient } from './torn-api.js';
import {
  ForumSubscribedThreadsResponse,
  ForumSubscribedThread,
  ForumThreadResponse,
  ForumThreadExtended
} from '../models/api-types.js';

const apiClient = new TornApiClient();

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    await apiClient.get<ForumSubscribedThreadsResponse>('/user/forumsubscribedthreads', apiKey);
    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error occurred' };
  }
}

export async function getSubscribedThreads(apiKey: string): Promise<ForumSubscribedThread[]> {
  const response = await apiClient.get<ForumSubscribedThreadsResponse>(
    '/user/forumsubscribedthreads',
    apiKey
  );

  // Validate response structure
  if (!response || typeof response !== 'object') {
    console.error('Invalid response:', response);
    throw new Error('Invalid response from API');
  }

  if (!response.forumSubscribedThreads) {
    console.error('Missing forumSubscribedThreads in response:', response);
    throw new Error('API response missing forumSubscribedThreads property');
  }

  if (!Array.isArray(response.forumSubscribedThreads)) {
    console.error('forumSubscribedThreads is not an array:', typeof response.forumSubscribedThreads, response.forumSubscribedThreads);
    throw new Error('API response forumSubscribedThreads is not an array');
  }

  return response.forumSubscribedThreads;
}

export async function getThreadDetails(apiKey: string, threadId: number): Promise<ForumThreadExtended> {
  const response = await apiClient.get<ForumThreadResponse>(
    `/forum/${threadId}/thread`,
    apiKey
  );
  return response.thread;
}
