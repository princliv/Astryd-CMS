import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { DEMO_PASSWORD } from '../seed';
import type { LoginRequest, User } from '../../types';

/**
 * The mock token encodes the userId directly (`mock-token-<userId>-<issuedAt>`) rather than being
 * looked up in a server-side session map, because that map would live inside the MSW service
 * worker's memory - which the browser can and does silently restart between page navigations,
 * wiping any in-memory session state and causing a false logout on a hard reload.
 */
function issueToken(userId: string) {
  return `mock-token-${userId}-${Date.now()}`;
}

function userIdFromToken(token: string): string | undefined {
  const match = token.match(/^mock-token-(.+)-\d+$/);
  return match?.[1];
}

function userFromAuthHeader(request: Request): User | undefined {
  const auth = request.headers.get('authorization');
  const token = auth?.replace(/^Bearer\s+/i, '');
  const userId = token ? userIdFromToken(token) : undefined;
  return db.data.users.find((u) => u.id === userId);
}

/**
 * Whether `user` may operate on `siteId` - the backend's `require_restaurant` rule: a non-suspended Site of
 * the caller's own Org that is in their `siteAccess` ('all' = every Site). Super Admins reach any live Site.
 */
function canAccessSite(user: User | undefined, siteId: string): boolean {
  const site = db.data.restaurants.find((r) => r.id === siteId);
  if (!user || !site || site.status === 'suspended') return false;
  if (user.role === 'super_admin') return true;
  return site.organizationId === user.organizationId && (user.siteAccess === 'all' || user.siteAccess.includes(siteId));
}

/** Non-suspended Sites of one Org the caller may operate on (the backend's `accessible_site_ids`). */
function accessibleSiteIds(user: User, organizationId: string): string[] {
  return db.data.restaurants
    .filter((r) => r.organizationId === organizationId && r.status !== 'suspended')
    .filter((r) => user.role === 'super_admin' || user.siteAccess === 'all' || user.siteAccess.includes(r.id))
    .map((r) => r.id);
}

/**
 * Sites an Org-wide reservations/orders list may read (the backend's `org_operations_scope`): the caller's own
 * Org only, its non-suspended Sites in their `siteAccess`; `?siteId=` narrows to one (403 when not accessible).
 */
function orgOperationsScope(
  request: Request,
  organizationId: string,
): { siteIds: string[]; names: Map<string, string> } | { failure: Response } {
  const user = userFromAuthHeader(request);
  if (!user) return { failure: HttpResponse.json({ error: 'unauthorized', message: 'Not logged in.' }, { status: 401 }) };
  const org = db.data.organizations.find((o) => o.id === organizationId);
  if (!org || (user.role !== 'super_admin' && user.organizationId !== organizationId)) {
    return { failure: HttpResponse.json({ error: 'forbidden', message: 'Organization access denied' }, { status: 403 }) };
  }
  let siteIds = accessibleSiteIds(user, organizationId);
  const requested = new URL(request.url).searchParams.get('siteId');
  if (requested) {
    if (!siteIds.includes(requested)) {
      return { failure: HttpResponse.json({ error: 'forbidden', message: 'Restaurant access denied' }, { status: 403 }) };
    }
    siteIds = [requested];
  }
  const names = new Map(db.data.restaurants.filter((r) => siteIds.includes(r.id)).map((r) => [r.id, r.name]));
  return { siteIds, names };
}

export const authHandlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const org = db.data.organizations.find((o) => o.code.toLowerCase() === body.orgId?.trim().toLowerCase());
    if (!org) {
      return HttpResponse.json(
        { error: { code: 'invalid_org', message: 'Unknown Organization ID.' } },
        { status: 401 },
      );
    }
    const user = db.data.users.find(
      (u) => u.organizationId === org.id && u.email.toLowerCase() === body.email.toLowerCase(),
    );
    if (!user || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json(
        { error: { code: 'invalid_credentials', message: 'Incorrect email or password.' } },
        { status: 401 },
      );
    }
    const token = issueToken(user.id);
    return HttpResponse.json({
      user,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    });
  }),

  /** Multi-Vertical Platform Plan §5.1 - Super Admin isn't scoped to an Org, so no `orgId` is required or checked here. */
  http.post('*/api/v1/auth/super-admin-login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = db.data.users.find((u) => u.role === 'super_admin' && u.email.toLowerCase() === body.email.toLowerCase());
    if (!user || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json(
        { error: { code: 'invalid_credentials', message: 'Incorrect email or password.' } },
        { status: 401 },
      );
    }
    const token = issueToken(user.id);
    return HttpResponse.json({
      user,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    });
  }),

  http.post('*/api/v1/auth/logout', () => HttpResponse.json({ message: 'Logged out.' })),

  http.post('*/api/v1/auth/forgot-password', () =>
    HttpResponse.json({ message: 'If that email exists, a reset link has been sent.' }),
  ),

  http.get('*/api/v1/auth/me', ({ request }) => {
    const user = userFromAuthHeader(request);
    if (!user) return HttpResponse.json({ error: { code: 'unauthorized', message: 'Not logged in.' } }, { status: 401 });
    return HttpResponse.json({ user });
  }),
];

export { userFromAuthHeader, issueToken, canAccessSite, accessibleSiteIds, orgOperationsScope };
