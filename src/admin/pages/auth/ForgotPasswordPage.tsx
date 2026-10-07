import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, MailCheck } from 'lucide-react';
import { forgotPassword } from '../../../services/auth';
import { AuthError, AuthField, AuthSubmit, authLinkClass } from '../../components/forms/AuthField';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email, orgId });
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,196,205,0.12)]">
          <MailCheck className="h-6 w-6 astryd-text-cyan" />
        </div>
        <p className="text-[13px] astryd-text-muted">If that email exists, a reset link has been sent.</p>
        <Link to="/login" className={`text-[13px] ${authLinkClass}`}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-[13px] astryd-text-muted">Enter your email and we'll send you a reset link.</p>
      {error && <AuthError>{error}</AuthError>}
      <AuthField label="Organization ID" icon={Building2} required value={orgId} onChange={(e) => setOrgId(e.target.value)} />
      <AuthField label="Email" icon={Mail} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      <AuthSubmit>Send reset link</AuthSubmit>
      <div className="text-center">
        <Link to="/login" className={`text-[13px] ${authLinkClass}`}>
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
