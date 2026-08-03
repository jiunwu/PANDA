'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import Link from 'next/link';

const USERS = [
  { id: 'nina', label: 'Nina', initial: 'N' },
  { id: 'jiun', label: 'Jiun', initial: 'J' },
];

export default function SetupPage() {
  const [selectedUser, setSelectedUser] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  async function handleRegister() {
    if (!selectedUser) return;

    setStatus('loading');
    setMessage('');

    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.error || 'Failed to get registration options');
      }

      const options = await optionsRes.json();

      // Step 2: Start the browser's credential creation ceremony
      const credential = await startRegistration({ optionsJSON: options });

      // Step 3: Send the credential to server for verification
      const verifyRes = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, credential }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || 'Verification failed');
      }

      const result = await verifyRes.json();
      if (result.verified) {
        setStatus('success');
        setMessage(`Passkey registered for ${selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1)}!`);
      } else {
        throw new Error('Registration was not verified');
      }
    } catch (error) {
      setStatus('error');
      if (error.name === 'NotAllowedError') {
        setMessage('Registration was cancelled or timed out.');
      } else {
        setMessage(error.message || 'Registration failed');
      }
    }
  }

  const user = USERS.find((u) => u.id === selectedUser);

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-title">PANDA</h1>
          <p className="login-subtitle">Set up your passkey</p>
        </div>

        <div className="login-form">
          {/* User selection */}
          <div className="login-field">
            <label htmlFor="setup-user" className="field-label">Who are you?</label>
            <div className="user-select-wrapper">
              <select
                id="setup-user"
                className="field-input login-select"
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setStatus('idle');
                  setMessage('');
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
          {user && status === 'idle' && (
            <div className="setup-info">
              <div className="user-avatar">{user.initial}</div>
              <div>
                <p className="setup-info-name">{user.label}</p>
                <p className="setup-info-desc">
                  Register a passkey to sign in with biometrics, Face ID, or your device PIN.
                </p>
              </div>
            </div>
          )}

          {/* Status messages */}
          {status === 'success' && (
            <div className="setup-status setup-status-success">
              <span className="setup-status-icon">✓</span>
              <span>{message}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="setup-status setup-status-error">
              <span>{message}</span>
            </div>
          )}

          {/* Action button */}
          {status !== 'success' ? (
            <button
              type="button"
              className="btn btn-primary login-btn"
              disabled={!selectedUser || status === 'loading'}
              onClick={handleRegister}
            >
              <span className="passkey-icon">🔑</span>
              {status === 'loading' ? 'Waiting for browser...' : 'Register Passkey'}
            </button>
          ) : (
            <div className="setup-done-actions">
              <Link href="/login" className="btn btn-primary login-btn">
                Go to Login
              </Link>
              <button
                type="button"
                className="btn btn-secondary login-btn"
                onClick={() => {
                  setStatus('idle');
                  setMessage('');
                }}
              >
                Register Another
              </button>
            </div>
          )}
        </div>

        <Link href="/" className="login-back">Back to homepage</Link>
      </div>
    </div>
  );
}
