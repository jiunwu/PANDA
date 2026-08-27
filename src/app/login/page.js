'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import Link from 'next/link';

const USERS = [
  { id: 'nina', label: 'Nina', initial: 'N' },
  { id: 'jiun', label: 'Jiun', initial: 'J' },
];

function LoginForm() {
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '/dashboard';

  async function handlePasskeyLogin() {
    if (!selectedUser) return;

    setError('');
    setLoading(true);

    try {
      // Step 1: Get authentication options
      const optionsRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error || 'Failed to get login options');
      }

      const options = await optionsRes.json();

      // Step 2: Start the browser's authentication ceremony
      const credential = await startAuthentication({ optionsJSON: options });

      // Step 3: Verify on server
      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, credential }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Login failed');
      }

      const result = await verifyRes.json();
      if (result.verified) {
        router.push(from);
        router.refresh();
      } else {
        throw new Error('Authentication was not verified');
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setError('Authentication was cancelled or timed out. If on a public computer, choose "Use a phone or tablet" and scan the QR code with your iPhone.');
      } else if (error.name === 'SecurityError') {
        setError('Security error. Make sure you are accessing this site over HTTPS.');
      } else {
        setError(error.message || 'Login failed. If on a public computer, try the "Use a phone or tablet" option in the browser popup.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    if (!selectedUser) return;

    setError('');
    setLoading(true);

    try {
      const verifyRes = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Dev login failed');
      }

      const result = await verifyRes.json();
      if (result.verified) {
        router.push(from);
        router.refresh();
      }
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const user = USERS.find((u) => u.id === selectedUser);

  return (
    <div className="login-form">
      {/* User selection */}
      <div className="login-field">
        <label htmlFor="login-user" className="field-label">Login as</label>
        <div className="user-select-wrapper">
          <select
            id="login-user"
            className="field-input login-select"
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setError('');
            }}
          >
            <option value="">Select your name</option>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected user indicator */}
      {user && (
        <div className="login-user-badge">
          <div className="user-avatar">{user.initial}</div>
          <span className="login-user-name">{user.label}</span>
        </div>
      )}

      {error && <div className="login-error">{error}</div>}

      <button
        type="button"
        className="btn btn-primary login-btn"
        disabled={loading || !selectedUser}
        onClick={handlePasskeyLogin}
      >
        <span className="passkey-icon">🔑</span>
        {loading ? 'Waiting for browser...' : 'Login with Passkey'}
      </button>

      <p className="login-hint" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', lineHeight: 1.4 }}>
        📱 On a public computer? Choose <strong>&quot;Use a phone or tablet&quot;</strong> in the browser popup, then scan the QR code with your iPhone.
      </p>

      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') && (
        <button
          type="button"
          className="btn btn-secondary login-btn"
          style={{ marginTop: '10px' }}
          disabled={loading || !selectedUser}
          onClick={handleDevLogin}
        >
          <span className="passkey-icon">🛠️</span>
          Bypass Passkey (Dev/Preview)
        </button>
      )}

      <div className="login-setup-link">
        <span>First time?</span>{' '}
        <Link href="/setup">Set up your passkey</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">PANDA</h1>
          <p className="login-subtitle">Team access</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>

        <a href="/" className="login-back">Back to homepage</a>
      </div>
    </div>
  );
}
