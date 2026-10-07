import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../services/http';
import { AuthError, AuthField, AuthSubmit, authLinkClass, authQuietLinkClass } from '../../components/forms/AuthField';

export function LoginPage() {
  const mocks = import.meta.env.VITE_USE_MOCKS === 'true';
  const demo = mocks || import.meta.env.MODE === 'staging';
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [orgId, setOrgId] = useState(demo ? 'LUMIERE' : '');
  const [email, setEmail] = useState(demo ? mocks ? 'owner@lumiere.com' : 'admin@lumiere.com' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(orgId.trim(), email.trim(), password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'invalid_credentials' || err.code === 'invalid_org')) {
        setError('Incorrect Organization ID, email, or password.');
      } else if (err instanceof TypeError || (err instanceof ApiError && err.status >= 500)) {
        setError('Could not reach the login service. Wait a moment and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/admin'} replace />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <AuthError>{error}</AuthError>}

      <AuthField
        label="Organization ID"
        icon={Building2}
        required
        type="text"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        autoCapitalize="characters"
        className="uppercase"
      />
      <AuthField
        label="Email"
        icon={Mail}
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />
      <AuthField
        label="Password"
        icon={Lock}
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      <AuthSubmit busy={isSubmitting} busyLabel="Signing in…">
        Sign in
      </AuthSubmit>

      <div className="space-y-3 pt-1 text-center">
        <p className="text-[13px] astryd-text-muted">
          <Link to="/forgot-password" className={authLinkClass}>
            Forgot password?
          </Link>
        </p>
        <p className="text-[13px] astryd-text-muted">
          New here?{' '}
          <Link to="/signup" className={authLinkClass}>
            Create your site
          </Link>
        </p>
        <Link to="/super-admin" className={authQuietLinkClass}>
          Platform team? Sign in here
        </Link>
      </div>
    </form>
  );
}
