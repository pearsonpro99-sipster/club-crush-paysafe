'use client';

import { useState } from 'react';
import { MockUser, signIn, signUp, signOut, deleteAccount } from '@/lib/auth';

type View = 'signin' | 'signup' | 'account';

interface AuthModalProps {
  user: MockUser | null;
  onClose: () => void;
  onAuthChange: (user: MockUser | null) => void;
}

export default function AuthModal({ user, onClose, onAuthChange }: AuthModalProps) {
  const [view, setView]         = useState<View>(user ? 'account' : 'signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [confirm, setConfirm]   = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    const result = signIn(email);
    if (!result) {
      setError('No account found. Please sign up first.');
      return;
    }
    onAuthChange(result);
    onClose();
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const result = signUp(name, email);
    onAuthChange(result);
    onClose();
  };

  const handleSignOut = () => {
    signOut();
    onAuthChange(null);
    onClose();
  };

  const handleDelete = () => {
    if (!confirm) { setConfirm(true); return; }
    deleteAccount();
    onAuthChange(null);
    onClose();
  };

  const INPUT = {
    width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
    borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  };
  const BTN_PRIMARY = {
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    background: '#0072CE', color: '#fff', fontSize: 15, fontWeight: 800,
    cursor: 'pointer', letterSpacing: 0.5,
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
              {view === 'account' ? `Hi, ${user?.name?.split(' ')[0]} 👋` : view === 'signin' ? 'Sign In' : 'Create Account'}
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
                  Full Cognito integration coming — your data will sync across devices.
                </p>
              </div>

              <button onClick={handleSignOut} style={{ ...BTN_PRIMARY, background: '#ffffff12', marginBottom: 8 }}>
                Sign Out
              </button>

              {!confirm ? (
                <button onClick={handleDelete} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#ff5555', fontSize: 12, cursor: 'pointer' }}>
                  Delete Account
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#ff5555', fontSize: 12, marginBottom: 8 }}>Are you sure? This cannot be undone.</p>
                  <button onClick={handleDelete} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #ff5555', background: 'transparent', color: '#ff5555', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Yes, delete my account
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
              <button type="submit" style={BTN_PRIMARY}>Sign In</button>
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
                type="password" placeholder="Password (min 6 chars)" value={password}
                onChange={e => setPassword(e.target.value)} style={INPUT} autoComplete="new-password"
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>{error}</p>}
              <button type="submit" style={BTN_PRIMARY}>Create Account</button>
              <p style={{ color: '#ffffff33', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                Already have an account?{' '}
                <span onClick={() => { setView('signin'); setError(''); }} style={{ color: '#4FC3F7', cursor: 'pointer', fontWeight: 700 }}>
                  Sign in
                </span>
              </p>
            </form>
          )}

          {/* Cognito note */}
          {view !== 'account' && (
            <p style={{ color: '#ffffff18', fontSize: 10, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              🔒 Authentication powered by AWS Cognito.<br />
              Real integration pending backend setup.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
