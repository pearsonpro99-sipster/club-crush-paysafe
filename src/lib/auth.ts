import { configureAmplify } from '@/lib/amplify';
import {
  getCurrentUser,
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  deleteUser as amplifyDeleteUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';

export interface MockUser {
  name: string;
  email: string;
}

// Module-level cache so getUser() remains synchronous for existing call sites
let _cachedUser: MockUser | null = null;

/** Async — call once on app boot. Populates the synchronous getUser() cache. */
export async function initAuth(): Promise<MockUser | null> {
  if (typeof window === 'undefined') return null;
  configureAmplify();
  try {
    const [cognitoUser, attrs] = await Promise.all([getCurrentUser(), fetchUserAttributes()]);
    const name  = attrs.name  || cognitoUser.username;
    const email = attrs.email || '';
    _cachedUser = { name, email };
    return _cachedUser;
  } catch {
    _cachedUser = null;
    return null;
  }
}

/** Synchronous — returns the cached user (populated by initAuth). */
export function getUser(): MockUser | null {
  return _cachedUser;
}

/** Sign in with email + password. Returns the user on success. */
export async function signIn(email: string, password: string): Promise<MockUser> {
  configureAmplify();
  const { isSignedIn } = await amplifySignIn({
    username: email.trim().toLowerCase(),
    password,
  });
  if (!isSignedIn) throw new Error('Sign-in requires additional steps.');
  const user = await initAuth();
  if (!user) throw new Error('Sign-in succeeded but could not retrieve user.');
  return user;
}

/** Sign up — sends a Cognito verification email. */
export async function signUp(name: string, email: string, password: string): Promise<void> {
  configureAmplify();
  await amplifySignUp({
    username: email.trim().toLowerCase(),
    password,
    options: {
      userAttributes: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    },
  });
}

/** Confirm sign-up with the 6-digit code emailed by Cognito. */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  configureAmplify();
  await amplifyConfirmSignUp({
    username: email.trim().toLowerCase(),
    confirmationCode: code.trim(),
  });
}

export async function signOut(): Promise<void> {
  configureAmplify();
  await amplifySignOut();
  _cachedUser = null;
}

export async function deleteAccount(): Promise<void> {
  configureAmplify();
  await amplifyDeleteUser();
  _cachedUser = null;
}

/** Returns the current Cognito access token, or null if not signed in. */
export async function getAccessToken(): Promise<string | null> {
  configureAmplify();
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}
