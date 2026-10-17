import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { ManagementPage } from './components/booking/ManagementPage';
import { AdminApp } from './admin/AdminApp';
import { queryClient } from './queryClient';
import { setAuthToken } from './services/http';

async function bootstrap() {
  setAuthToken(localStorage.getItem('lumiere-cms-token'));
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
    // MSW's service worker loses its connected-tabs list whenever Chrome stops it as idle; re-attach on
    // demand instead of leaving the tab on skeletons until a reload.
    const { keepMockWorkerAttached } = await import('./mocks/keepAttached');
    const { setMockRecovery } = await import('./services/mockRecovery');
    setMockRecovery(keepMockWorkerAttached());
  } else if ('serviceWorker' in navigator) {
    // Retire only MSW registrations when switching a local mock preview to real APIs.
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const script = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
      if (script && new URL(script).pathname.endsWith('/mockServiceWorker.js')) await registration.unregister();
    }
  }

  // The platform's own paths (login, super-admin login, and the bare root) always render the admin
  // app, not a client's website - a client's site is only ever reached via ?preview=true from inside
  // the admin (Multi-Vertical Platform Plan §4/§4.1; real tenant domains land differently once §9 ships).
  const path = window.location.pathname;
  const management = /^\/s\/[^/]+\/reservation\/[^/]+$/.test(path);
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
  const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined;
  const tenantHost = Boolean(platformDomain && window.location.hostname.endsWith(`.${platformDomain}`));
  const platformPaths = ['/', '/login', '/signup', '/super-admin', '/forgot-password', '/reset-password'];
  const isAdmin = !isPreview && !tenantHost && (path.startsWith('/admin') || platformPaths.includes(path));

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>{management ? <ManagementPage /> : isAdmin ? <AdminApp /> : <App />}</QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
