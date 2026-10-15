import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { SuperAdminLoginPage } from './pages/auth/SuperAdminLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ReservationsPage } from './pages/reservations/ReservationsPage';
import { MediaLibraryPage } from './pages/website/MediaLibraryPage';
import { PagesHubPage } from './pages/website/editor/PagesHubPage';
import { SiteEditorPage } from './pages/website/editor/SiteEditorPage';
import { LegacyContentRedirect, LegacySectionRedirect } from './pages/website/editor/legacyRedirects';
import { CategoriesPage } from './pages/menu/CategoriesPage';
import { MenuItemsPage } from './pages/menu/MenuItemsPage';
import { MenuItemFormPage } from './pages/menu/MenuItemFormPage';
import { AddonsPage } from './pages/menu/AddonsPage';
import { OffersPage } from './pages/menu/OffersPage';
import { InformationPage } from './pages/restaurant/InformationPage';
import { ContactPage } from './pages/restaurant/ContactPage';
import { HoursPage } from './pages/restaurant/HoursPage';
import { SocialMediaPage } from './pages/restaurant/SocialMediaPage';
import { AccountPage } from './pages/settings/AccountPage';
import { UsersPage } from './pages/settings/UsersPage';
import { LocationsPage } from './pages/settings/LocationsPage';
import { DomainsPage } from './pages/settings/DomainsPage';
import { WebsiteSyncPage } from './pages/settings/WebsiteSyncPage';
import { ReserveSettingsPage } from './pages/settings/ReserveSettingsPage';
import { SuperAdminSitesPage } from './pages/superadmin/SitesPage';
import { MembershipPage } from './pages/membership/MembershipPage';

/** `/admin`'s index route - a Super Admin has no Site of its own, so it lands on the Platform area
 * instead of a Dashboard scoped to whichever Site happened to be the fallback (Plan §4/§5.1). */
function AdminIndex() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <Navigate to="/admin/superadmin/sites" replace /> : <DashboardPage />;
}

export function AdminRoutes() {
  return (
    <Routes>
      {/* Platform entry points live at the app root, not under /admin - opening the app should never show a client's website (Multi-Vertical Platform Plan §4/§4.1). */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/super-admin" element={<SuperAdminLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/admin" element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminIndex />} />

          {/* Everything below is scoped to one Site/Org and belongs to an Owner or Staff - a Super Admin
              isn't a member of any Org, so none of these apply to it (Plan §4/§5.1); it's redirected back
              to the Platform area above. */}
          <Route element={<RequireRole allow={['owner', 'staff']} />}>
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="membership" element={<MembershipPage />} />

            <Route path="website" element={<Navigate to="/admin/website/pages" replace />} />
            <Route path="website/pages" element={<PagesHubPage />} />
            <Route path="website/pages/:page" element={<SiteEditorPage />} />
            <Route path="website/media" element={<MediaLibraryPage />} />
            {/* Old addresses from before the Site Editor - kept so bookmarks and links still land in the right place. */}
            <Route path="website/homepage" element={<Navigate to="/admin/website/pages/home" replace />} />
            <Route path="website/homepage/:type" element={<LegacySectionRedirect />} />
            <Route path="website/header" element={<Navigate to="/admin/website/pages/header-footer" replace />} />
            <Route path="website/branding" element={<Navigate to="/admin/website/pages/theme" replace />} />
            <Route path="website/content" element={<Navigate to="/admin/website/pages/home?tab=content" replace />} />
            <Route path="website/content/:page" element={<LegacyContentRedirect />} />

            <Route path="menu/categories" element={<CategoriesPage />} />
            <Route path="menu/items" element={<MenuItemsPage />} />
            <Route path="menu/items/:itemId" element={<MenuItemFormPage />} />
            <Route path="menu/addons" element={<AddonsPage />} />
            <Route path="menu/offers" element={<OffersPage />} />

            <Route path="restaurant/information" element={<InformationPage />} />
            <Route path="restaurant/contact" element={<ContactPage />} />
            <Route path="restaurant/hours" element={<HoursPage />} />
            <Route path="restaurant/social" element={<SocialMediaPage />} />

            <Route path="settings/pages" element={<Navigate to="/admin/website/pages" replace />} />
          </Route>
          {/* Account is the one screen every role reaches - it's the signed-in user's own profile, not a Site's. */}
          <Route path="settings/account" element={<AccountPage />} />
          <Route element={<RequireRole allow={['owner']} />}>
            <Route path="settings/locations" element={<LocationsPage />} />
            <Route path="settings/users" element={<UsersPage />} />
            <Route path="settings/website-sync" element={<WebsiteSyncPage />} />
            <Route path="settings/reserve" element={<ReserveSettingsPage />} />
            <Route path="settings/domains" element={import.meta.env.VITE_USE_MOCKS === 'true' ? <DomainsPage /> : <p>Custom domains are not enabled yet. Use your platform site address.</p>} />
          </Route>
          <Route element={<RequireRole allow={['super_admin']} />}>
            <Route path="superadmin/sites" element={<SuperAdminSitesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
