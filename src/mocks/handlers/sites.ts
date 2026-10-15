import { http, HttpResponse } from 'msw';
import { db, nowIso } from '../db';
import { userFromAuthHeader } from './auth';
import { copySiteSetup, formatAddress, provisionSite, validateAddress, type CopySiteOptions } from '../provisionSite';
import { VERTICALS, type Restaurant, type User, type Vertical } from '../../types';

function forbidden() {
  return HttpResponse.json({ error: { code: 'forbidden', message: 'Super Admin access required.' } }, { status: 403 });
}

function validationError(message: string) {
  return HttpResponse.json({ error: 'validation_error', message }, { status: 400 });
}

/** The backend's `org_access`: the caller's own Org (owner-only when `owner`); Super Admins reach any Org. */
function orgAccess(request: Request, orgId: string, owner = false): { user: User } | { failure: Response } {
  const user = userFromAuthHeader(request);
  if (!user) return { failure: HttpResponse.json({ error: 'unauthorized', message: 'Not logged in.' }, { status: 401 }) };
  const org = db.data.organizations.find((o) => o.id === orgId);
  if (user.role === 'super_admin') {
    return org ? { user } : { failure: HttpResponse.json({ error: 'not_found' }, { status: 404 }) };
  }
  if (!org || user.organizationId !== orgId || (owner && user.role !== 'owner')) {
    return { failure: HttpResponse.json({ error: 'forbidden', message: 'Organization access denied' }, { status: 403 }) };
  }
  return { user };
}

/** Mirrors the backend's `text()` validator - required, trimmed, bounded. Throws on bad input. */
function requiredText(value: unknown, field: string, maximum = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`${field} is required and must be at most ${maximum} characters`);
  }
  return value.trim();
}

const RESERVED_SLUGS = new Set(['www', 'api', 'admin', 'app', 'login', 'signup']);
const COPY_PARTS = ['branding', 'menu', 'reservations'] as const;

/** Normalises `copyFrom`; the source must be a Site of the same Org. `null` when nothing is to be copied. */
function validateCopyOptions(orgId: string, value: unknown): ({ siteId: string } & CopySiteOptions) | null {
  if (value === null || value === undefined) return null;
  const allowedKeys: readonly string[] = ['siteId', ...COPY_PARTS];
  if (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw new Error('copyFrom may only contain siteId, branding, menu and reservations');
  }
  const raw = value as Record<string, unknown>;
  if (COPY_PARTS.some((part) => part in raw && typeof raw[part] !== 'boolean')) throw new Error('copyFrom options must be booleans');
  const source = db.data.restaurants.find((r) => r.id === raw.siteId && r.organizationId === orgId);
  if (typeof raw.siteId !== 'string' || !source) throw new Error('copyFrom.siteId must be a location of this organization');
  const options: CopySiteOptions = { branding: raw.branding === true, menu: raw.menu === true, reservations: raw.reservations === true };
  return Object.values(options).some(Boolean) ? { siteId: source.id, ...options } : null;
}

/** Mirrors the backend's `validate_location()` - every new outlet needs a real map position. Throws on bad input. */
function validateLocation(value: unknown, placeId: unknown) {
  const raw = (value ?? {}) as Record<string, unknown>;
  if (typeof value !== 'object' || value === null || !['owner', 'google'].includes(raw.source as string)) {
    throw new Error("Find the location's address or place it on the map");
  }
  const coordinate = (v: unknown, maximum: number) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > maximum) throw new Error('location needs valid latitude and longitude');
    return v;
  };
  coordinate(raw.latitude, 90);
  coordinate(raw.longitude, 180);
  if (raw.source === 'google' && (typeof placeId !== 'string' || !placeId)) throw new Error('A Google Place ID is required for a Google location');
}

/** A Site without website settings counts as published, as in the backend's `_published()`. */
function isPublished(siteId: string) {
  const website = db.data.website[siteId];
  return !website || website.publishStatus === 'published';
}

export const siteHandlers = [
  http.get('*/api/v1/organizations/:orgId/sites', ({ params, request }) => {
    const caller = userFromAuthHeader(request);
    const orgSites = db.data.restaurants.filter((r) => r.organizationId === params.orgId);
    const visible =
      !caller || caller.siteAccess === 'all' ? orgSites : orgSites.filter((r) => caller.siteAccess.includes(r.id));
    return HttpResponse.json(visible);
  }),

  /** Owner only - adds another outlet (Site) to the Org, optionally starting from a sibling's branding / menu / booking set-up. */
  http.post('*/api/v1/organizations/:orgId/sites', async ({ params, request }) => {
    const orgId = params.orgId as string;
    const access = orgAccess(request, orgId, true);
    if ('failure' in access) return access.failure;
    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

    let site: Restaurant;
    try {
      const copyFrom = validateCopyOptions(orgId, body.copyFrom);
      // Every outlet of an Org is the same kind of business, so a new one inherits the existing outlets' type.
      // Older Sites (and browsers holding mock data saved before verticals existed) may lack one; then use what the form showed.
      const vertical =
        db.data.restaurants.find((r) => r.organizationId === orgId && VERTICALS.includes(r.vertical))?.vertical ??
        (VERTICALS.includes(body.vertical as Vertical) ? (body.vertical as Vertical) : 'restaurant');
      if (!VERTICALS.includes(vertical)) {
        throw new Error('vertical must be restaurant, gym, retail, salon, coffee or laundry');
      }
      validateLocation(body.location, body.googlePlaceId);
      const slug = requiredText(body.slug, 'slug', 63).toLowerCase();
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || RESERVED_SLUGS.has(slug)) throw new Error('Invalid or reserved subdomain');
      const name = requiredText(body.siteName ?? body.name, 'siteName');
      const address = validateAddress(body.address);
      if (db.data.restaurants.some((r) => r.slug === slug)) throw new Error('That subdomain is already taken');

      site = provisionSite({
        organizationId: orgId,
        ownerUserId: access.user.id,
        ownerEmail: typeof body.ownerEmail === 'string' ? body.ownerEmail : '',
        name,
        slug,
        vertical,
        address,
      });
      if (copyFrom) copySiteSetup(copyFrom.siteId, site.id, copyFrom, formatAddress(address));
    } catch (error) {
      return validationError(error instanceof Error ? error.message : 'Invalid request');
    }

    db.save();
    return HttpResponse.json(site, { status: 201 });
  }),

  /** Owner only - rename, re-address or suspend/reactivate an outlet; the Org must keep at least one live outlet. */
  http.patch('*/api/v1/organizations/:orgId/sites/:siteId', async ({ params, request }) => {
    const orgId = params.orgId as string;
    const siteId = params.siteId as string;
    const access = orgAccess(request, orgId, true);
    if ('failure' in access) return access.failure;
    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

    const statuses: string[] = ['active', 'suspended', 'trial'];
    if (Object.keys(body).some((key) => !['name', 'status', 'address', 'location', 'googlePlaceId'].includes(key)) || ('status' in body && !statuses.includes(body.status as string))) {
      return validationError('Only name, address, location and status can be changed');
    }
    const lastActive = !db.data.restaurants.some((r) => r.organizationId === orgId && r.id !== siteId && r.status !== 'suspended');
    if (body.status === 'suspended' && lastActive) return validationError('An organization needs at least one active location');

    const values: Partial<Restaurant> = {};
    try {
      if ('name' in body) values.name = requiredText(body.name, 'name');
      if ('status' in body) values.status = body.status as Restaurant['status'];
      if ('address' in body) values.address = validateAddress(body.address);
      if ('location' in body) validateLocation(body.location, body.googlePlaceId);
    } catch (error) {
      return validationError(error instanceof Error ? error.message : 'Invalid request');
    }
    const site = db.data.restaurants.find((r) => r.organizationId === orgId && r.id === siteId);
    if (!site) return HttpResponse.json({ error: 'not_found' }, { status: 404 });

    Object.assign(site, values, { updatedAt: nowIso() });
    db.save();
    return HttpResponse.json(site);
  }),

  /** Public - the live outlets of `siteId`'s Org, for the guest-facing "Which location?" picker in booking and ordering. */
  http.get('*/api/v1/public/sites/:siteId/locations', ({ params }) => {
    const siteId = params.siteId as string;
    const current = db.data.restaurants.find((r) => r.id === siteId);
    if (!current || current.status === 'suspended' || !current.organizationId || !isPublished(siteId)) {
      return HttpResponse.json({ error: 'not_found', message: 'Site not found' }, { status: 404 });
    }
    const moduleEnabled = (id: string, module: 'booking' | 'catalog') =>
      db.data.pageConfigs.some((p) => p.restaurantId === id && p.module === module && p.enabled);
    const locations = db.data.restaurants
      .filter((r) => r.organizationId === current.organizationId && r.status !== 'suspended' && isPublished(r.id))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        vertical: r.vertical ?? 'restaurant',
        address: r.address ?? null,
        addressText: formatAddress(r.address),
        modules: { booking: moduleEnabled(r.id, 'booking'), catalog: moduleEnabled(r.id, 'catalog') },
        current: r.id === siteId,
        // Mock Sites keep no map position, so directions fall back to the address.
        location: null,
        googlePlaceId: null,
      }));
    return HttpResponse.json(locations);
  }),

  /** Multi-Vertical Platform Plan §5.2 - every Site across every Org, for the Platform → Sites console. Super Admin only. */
  http.get('*/api/v1/superadmin/sites', ({ request }) => {
    const caller = userFromAuthHeader(request);
    if (!caller || caller.role !== 'super_admin') return forbidden();
    const orgNameById = new Map(db.data.organizations.map((o) => [o.id, o.name]));
    const rows = db.data.restaurants.map((site) => ({
      ...site,
      organizationName: orgNameById.get(site.organizationId) ?? 'Unknown organization',
    }));
    return HttpResponse.json(rows);
  }),

  /** The only write path for `brandingBadgeEnabled` - deliberately separate from the Org-editable brand/website endpoints. Super Admin only. */
  http.patch('*/api/v1/superadmin/sites/:id/branding-badge', async ({ params, request }) => {
    const caller = userFromAuthHeader(request);
    if (!caller || caller.role !== 'super_admin') return forbidden();
    const body = (await request.json()) as { enabled?: boolean };
    const site = db.data.restaurants.find((r) => r.id === params.id);
    if (!site) return HttpResponse.json({ error: { code: 'not_found', message: 'Site not found.' } }, { status: 404 });
    if (typeof body.enabled === 'boolean') site.brandingBadgeEnabled = body.enabled;
    site.updatedAt = nowIso();
    db.save();
    return HttpResponse.json(site);
  }),

  /** Public, read-only - lets the storefront footer decide whether to render the badge, and lets the whole public site style itself per Vertical (Plan §2), without exposing anything else about the Site. */
  http.get('*/api/v1/public/sites/:id/branding-badge', ({ params }) => {
    const site = db.data.restaurants.find((r) => r.id === params.id);
    return HttpResponse.json({ enabled: site?.brandingBadgeEnabled ?? true, vertical: site?.vertical ?? 'restaurant' });
  }),
];
