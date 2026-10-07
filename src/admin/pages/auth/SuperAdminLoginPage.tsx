import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AuthShell } from '../../components/AuthShell';
import { AuthError, AuthField, AuthSubmit, authQuietLinkClass } from '../../components/forms/AuthField';

/** Multi-Vertical Platform Plan §5.1 - Super Admin is us, isn't scoped to any Organization, and so never enters an Org ID. Deliberately a separate page/layout from the Org-scoped LoginPage rather than a mode toggle on it. */
export function SuperAdminLoginPage() {
  const { loginSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@platform.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginSuperAdmin(email, password);
      navigate('/admin/superadmin/sites', { replace: true });
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Platform Admin" subtitle="Super Admin sign in - manages every Organization on the platform">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthError>{error}</AuthError>}

        <AuthField label="Email" icon={Mail} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label="Password"
          icon={Lock}
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password123"
          hint="Demo password: password123"
        />

        <AuthSubmit busy={isSubmitting} busyLabel="Signing in…">
          Sign in
        </AuthSubmit>

        <div className="border-t border-[var(--astryd-divider)] pt-4 text-[11px] astryd-text-dim">
          <p>admin@platform.com (Super Admin)</p>
        </div>

        <div className="text-center">
          <Link to="/login" className={authQuietLinkClass}>
            Not platform team? Sign in to your Organization
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
