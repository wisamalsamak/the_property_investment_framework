// Account bar shown in the app header: sign in / sign up when logged out, and
// the current user's email + sign-out when logged in. Renders nothing when
// Supabase is not configured so the app degrades gracefully to guest mode.
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

function AuthDialog({ onClose }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        const data = await signUp(email, password);
        // If email confirmation is enabled there is no active session yet.
        if (data?.session) {
          onClose();
        } else {
          setInfo('Bitte bestätige deine E-Mail-Adresse über den zugesendeten Link.');
        }
      }
    } catch (err) {
      setError(err?.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-head">
          <h3>{mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}</h3>
          <button type="button" className="auth-close" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            E-Mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Passwort
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Bitte warten…' : mode === 'signin' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>
              Noch kein Konto?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(null); setInfo(null); }}>
                Registrieren
              </button>
            </>
          ) : (
            <>
              Bereits registriert?{' '}
              <button type="button" onClick={() => { setMode('signin'); setError(null); setInfo(null); }}>
                Anmelden
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthBar() {
  const { configured, loading, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // No auth backend configured -> stay in guest mode, render nothing.
  if (!configured) return null;
  if (loading) {
    return (
      <div className="auth-bar">
        <span className="auth-status">…</span>
      </div>
    );
  }

  return (
    <div className="auth-bar">
      {user ? (
        <>
          <span className="auth-status" title={user.email}>
            {user.email}
          </span>
          <button type="button" className="auth-link" onClick={() => signOut()}>
            Abmelden
          </button>
        </>
      ) : (
        <>
          <span className="auth-status auth-guest">Gast</span>
          <button type="button" className="auth-link" onClick={() => setOpen(true)}>
            Anmelden
          </button>
        </>
      )}

      {open && <AuthDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
