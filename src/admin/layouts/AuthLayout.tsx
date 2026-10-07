import { Outlet, useLocation } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';

/** Heading per screen - this layout wraps login and both password screens, and serves every business type. */
const SCREEN_HEADING: Record<string, { title: string; subtitle: string }> = {
  '/login': { title: 'Welcome back', subtitle: 'Sign in to access your dashboard' },
  '/forgot-password': { title: 'Forgot password', subtitle: "We'll email you a link to reset it" },
  '/reset-password': { title: 'Reset password', subtitle: 'Choose a new password for your account' },
};

export function AuthLayout() {
  const { pathname } = useLocation();
  const heading = SCREEN_HEADING[pathname] ?? SCREEN_HEADING['/login'];

  return (
    <AuthShell title={heading.title} subtitle={heading.subtitle}>
      <Outlet />
    </AuthShell>
  );
}
