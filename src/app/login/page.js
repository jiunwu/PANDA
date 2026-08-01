'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError('Wrong password');
        setPassword('');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          type="password"
          className="field-input login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter team password"
          autoFocus
          autoComplete="current-password"
        />
      </div>

      {error && <div className="login-error">{error}</div>}

      <button
        type="submit"
        className="btn btn-primary login-btn"
        disabled={loading || !password}
      >
        {loading ? 'Verifying...' : 'Continue'}
      </button>
    </form>
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
