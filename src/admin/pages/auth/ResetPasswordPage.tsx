import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { http } from '../../../services/http';
import { AuthField, AuthSubmit, authLinkClass } from '../../components/forms/AuthField';

export function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const verify = params.get('purpose') === 'verify';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      if (!verify && password !== confirmation) throw new Error('Passwords do not match.');
      const result = await http.post<{ message: string }>(verify ? '/auth/verify-email' : '/auth/reset-password', { token: params.get('token'), password, passwordConfirmation: confirmation });
      setMessage(result.message); setDone(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to use this link.'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-5">
    <p className="text-[13px] astryd-text-muted">{verify ? 'Verify your email before publishing your site.' : 'Set a new password. Links expire after one hour.'}</p>
    {!verify && !done && <>
      <AuthField label="Password" icon={Lock} required type="password" minLength={10} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      <AuthField label="Confirm password" icon={Lock} required type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="••••••••" hint="At least 10 characters, including letters and numbers." />
    </>}
    {message && <p role="status" className="text-[12px] astryd-text-muted">{message}</p>}
    {!done && <AuthSubmit busy={busy} busyLabel="Please wait…" disabled={!params.get('token')}>{verify ? 'Verify email' : 'Set password'}</AuthSubmit>}
    <div className="text-center">
      <Link to="/login" className={`text-[13px] ${authLinkClass}`}>Back to Sign In</Link>
    </div>
  </form>;
}
