import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { canAccessSite, userFromAuthHeader } from './auth';
import type { ReserveSettings } from '../../services/reserve';

/** Per-outlet Reserve settings for mock mode (kept in memory - they reset when the page reloads). */
const settingsBySite = new Map<string, ReserveSettings>();

function defaults(siteId: string): ReserveSettings {
  const vertical = db.data.restaurants.find((r) => r.id === siteId)?.vertical ?? 'restaurant';
  const areas = [
    { id: 'Indoor', name: 'Indoor' },
    { id: 'Outdoor', name: 'Outdoor' },
    { id: 'The Bar', name: 'The Bar' },
    { id: 'Private', name: 'Private' },
  ];
  return {
    vertical,
    booking_template_variant: 'a',
    google_place_id: null,
    location: null,
    timezone: null,
    booking_duration_mins: 120,
    slot_interval_mins: 15,
    booking_email_policy: '',
    booking_email_note: '',
    seating_areas: areas,
    tables: areas.flatMap((area, a) =>
      Array.from({ length: 4 }, (_, i) => ({ id: `${siteId}_t${a}${i}`, name: `Table ${a * 4 + i + 1}`, capacity: 4, seating_type: area.id, is_active: true })),
    ),
  };
}

function settingsFor(siteId: string) {
  if (!settingsBySite.has(siteId)) settingsBySite.set(siteId, defaults(siteId));
  return settingsBySite.get(siteId)!;
}

export const reserveHandlers = [
  http.get('*/api/v1/restaurants/:siteId/reserve-settings', ({ params, request }) => {
    const siteId = params.siteId as string;
    const user = userFromAuthHeader(request);
    if (!user || !canAccessSite(user, siteId)) return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
    return HttpResponse.json(settingsFor(siteId));
  }),

  http.put('*/api/v1/restaurants/:siteId/reserve-settings', async ({ params, request }) => {
    const siteId = params.siteId as string;
    const user = userFromAuthHeader(request);
    if (!user || !canAccessSite(user, siteId)) return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
    const body = ((await request.json().catch(() => null)) ?? {}) as Partial<ReserveSettings>;
    const next = { ...settingsFor(siteId), ...body };
    settingsBySite.set(siteId, next);
    return HttpResponse.json(next);
  }),
];
