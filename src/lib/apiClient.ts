import { getAccessToken } from '@/lib/auth';

/** Authenticated fetch — automatically attaches the Cognito Bearer token if available. */
export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
