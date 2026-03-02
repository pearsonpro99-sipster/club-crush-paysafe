'use client';

import { useState } from 'react';
import { MockUser, signIn, signUp, confirmSignUp, signOut, deleteAccount } from '@/lib/auth';

type View = 'signin' | 'signup' | 'verify' | 'account';

interface AuthModalProps {
  user: MockUser | null;
  onClose: () => void;
  onAuthChange: (user: MockUser | null) => void;
}

export default function AuthModal({ user, onClose, onAuthChange }: AuthModalProps) {
  const [view, setView]               = useState<View>(user ? 'account' : 'signin');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [code, setCode]               = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [confirm, setConfirm]         = useState(false);
  // Held during signup → verify flow so we can auto-sign-in after confirmation
  const [pendingEmail, setPendingEmail]       = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const result = await signIn(email, password);
      onAuthChange(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signUp(name, email, password);
      setPendingEmail(email);
      setPendingPassword(password);
      setView('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    try {
      await confirmSignUp(pendingEmail, code);
      // Auto sign-in after successful confirmation
      const result = await signIn(pendingEmail, pendingPassword);
      onAuthChange(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      onAuthChange(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    try {
      await deleteAccount();
      onAuthChange(null);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const INPUT = {
    width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
    borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const BTN_PRIMARY = {
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    background: loading ? '#0072CE88' : '#0072CE',
    color: '#fff', fontSize: 15, fontWeight: 800,
    cursor: loading ? 'default' : 'pointer', letterSpacing: 0.5,
  };

  const viewTitle = () => {
    if (view === 'account') return `Hi, ${user?.name?.split(' ')[0]} 👋`;
    if (view === 'signin')  return 'Sign In';
    if (view === 'signup')  return 'Create Account';
    return 'Check Your Email';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: '#111118', border: '1px solid #ffffff15',
          borderRadius: 20, overflow: 'hidden',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a1a 0%, #111118 100%)',
          borderBottom: '1px solid #ffffff10',
          padding: '18px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#ffffff33', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 2px' }}>
              Powered by AWS Cognito
            </p>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0 }}>
              {viewTitle()}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff44', fontSize: 20, cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── ACCOUNT VIEW ── */}
          {view === 'account' && user && (
            <div>
              <div style={{ background: '#ffffff08', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#0072CE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 10,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 15, margin: '0 0 2px' }}>{user.name}</p>
                <p style={{ color: '#ffffff55', fontSize: 12, margin: 0 }}>{user.email}</p>
              </div>

              <div style={{ background: '#ffffff06', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>Account</p>
                <p style={{ color: '#ffffff66', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Your fan score and game progress are linked to this account.
                  Scores sync across devices once the backend API is connected.
                </p>
              </div>

              <button onClick={handleSignOut} disabled={loading} style={{ ...BTN_PRIMARY, background: loading ? '#ffffff08' : '#ffffff12', marginBottom: 8 }}>
                {loading ? 'Signing out…' : 'Sign Out'}
              </button>

              {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: '0 0 8px', textAlign: 'center' }}>{error}</p>}

              {!confirm ? (
                <button onClick={handleDelete} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#ff5555', fontSize: 12, cursor: 'pointer' }}>
                  Delete Account
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#ff5555', fontSize: 12, marginBottom: 8 }}>Are you sure? This cannot be undone.</p>
                  <button onClick={handleDelete} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #ff5555', background: 'transparent', color: '#ff5555', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {loading ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SIGN IN VIEW ── */}
          {view === 'signin' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} style={INPUT} autoComplete="email"
              />
              <input
                type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} style={INPUT} autoComplete="current-password"
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={BTN_PRIMARY}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p style={{ color: '#ffffff33', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                No account?{' '}
                <span onClick={() => { setView('signup'); setError(''); }} style={{ color: '#4FC3F7', cursor: 'pointer', fontWeight: 700 }}>
                  Sign up
                </span>
              </p>
            </form>
          )}

          {/* ── SIGN UP VIEW ── */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text" placeholder="First name" value={name}
                onChange={e => setName(e.target.value)} style={INPUT} autoComplete="given-name"
              />
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} style={INPUT} autoComplete="email"
              />
              <input
                type="password" placeholder="Password (min 8 chars)" value={password}
                onChange={e => setPassword(e.target.value)} style={INPUT} autoComplete="new-password"
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={BTN_PRIMARY}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p style={{ color: '#ffffff33', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                Already have an account?{' '}
                <span onClick={() => { setView('signin'); setError(''); }} style={{ color: '#4FC3F7', cursor: 'pointer', fontWeight: 700 }}>
                  Sign in
                </span>
              </p>
            </form>
          )}

          {/* ── VERIFY VIEW ── */}
          {view === 'verify' && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#0072CE18', border: '1px solid #0072CE33', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ color: '#4FC3F7', fontWeight: 800, fontSize: 14, margin: '0 0 4px' }}>📧 Check your email</p>
                <p style={{ color: '#ffffff55', fontSize: 12, margin: 0 }}>
                  We sent a 6-digit code to <strong style={{ color: '#ffffffaa' }}>{pendingEmail}</strong>
                </p>
              </div>
              <input
                type="text" placeholder="Enter 6-digit code" value={code}
                onChange={e => setCode(e.target.value)} style={{ ...INPUT, textAlign: 'center', fontSize: 20, letterSpacing: 6, fontWeight: 700 }}
                inputMode="numeric" maxLength={6} autoComplete="one-time-code"
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={BTN_PRIMARY}>
                {loading ? 'Verifying…' : 'Confirm & Sign In'}
              </button>
              <p style={{ color: '#ffffff33', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                Wrong email?{' '}
                <span onClick={() => { setView('signup'); setError(''); }} style={{ color: '#4FC3F7', cursor: 'pointer', fontWeight: 700 }}>
                  Go back
                </span>
              </p>
            </form>
          )}

          {/* Cognito note */}
          {view !== 'account' && (
            <p style={{ color: '#ffffff18', fontSize: 10, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              🔒 Authentication powered by AWS Cognito.<br />
              Add your Cognito credentials to .env.local to activate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
