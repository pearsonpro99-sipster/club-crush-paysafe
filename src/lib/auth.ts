const USER_KEY = 'mock_user';

export interface MockUser {
  name:  string;
  email: string;
}

export function getUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function signUp(name: string, email: string): MockUser {
  const user: MockUser = { name: name.trim(), email: email.trim().toLowerCase() };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/** Mock sign-in — accepts any password, just checks email exists in storage */
export function signIn(email: string): MockUser | null {
  const stored = getUser();
  if (!stored) return null;
  if (stored.email !== email.trim().toLowerCase()) return null;
  return stored;
}

export function signOut(): void {
  // Keep the stored profile so they can sign back in — just clear session flag
  // (In production this would invalidate the Cognito token)
  // For mock purposes we remove the user entirely
  localStorage.removeItem(USER_KEY);
}

export function deleteAccount(): void {
  localStorage.removeItem(USER_KEY);
}
