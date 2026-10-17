import { db, nextId, nowIso } from './db';
import { buildStarterSections } from './seed';
import { VERTICAL_MODULE_DEFAULTS, defaultTemplateVariant } from '../data/onboardingDefaults';
import type {
  BrandSettings,
  Homepage,
  HomepageSection,
  PlatformModule,
  ReservationAvailabilitySettings,
  Restaurant,
  SiteAddress,
  Vertical,
  WeekDay,
} from '../types';

const WEEK_DAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const ADDRESS_FIELDS: Array<[keyof SiteAddress, number]> = [
  ['line1', 200],
  ['line2', 200],
  ['city', 120],
  ['region', 120],
  ['postalCode', 40],
  ['country', 120],
];

/** Mirrors the backend's `validate_address`: only the known fields, trimmed; all-blank (or `null`) clears it. Throws on bad input. */
export function validateAddress(value: unknown): SiteAddress | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('address may only contain line1, line2, city, region, postalCode and country');
  }
  const known = new Set<string>(ADDRESS_FIELDS.map(([field]) => field));
  if (Object.keys(value).some((key) => !known.has(key))) {
    throw new Error('address may only contain line1, line2, city, region, postalCode and country');
  }
  const address: Record<string, string> = {};
  for (const [field, maximum] of ADDRESS_FIELDS) {
    const entry = (value as Record<string, unknown>)[field] || '';
    if (typeof entry !== 'string' || entry.trim().length > maximum) {
      throw new Error(`address.${field} must be text of at most ${maximum} characters`);
    }
    address[field] = entry.trim();
  }
  return Object.values(address).some(Boolean) ? (address as unknown as SiteAddress) : null;
}

/** "line1, line2, city postalCode, region, country", skipping blanks - same as the backend's `format_address`. */
export function formatAddress(address: SiteAddress | null | undefined): string {
  if (!address) return '';
  const locality = [address.city, address.postalCode].filter(Boolean).join(' ');
  return [address.line1, address.line2, locality, address.region, address.country].filter(Boolean).join(', ');
}

export interface ProvisionSiteInput {
  organizationId: string;
  ownerUserId: string;
  ownerEmail: string;
  name: string;
  slug: string;
  vertical: Vertical;
  address?: SiteAddress | null;
  /** Defaults to the Vertical's module defaults (as the backend does when `modules` is omitted). */
  modules?: Array<{ module: PlatformModule; navLabel: string; enabled: boolean }>;
  branding?: { themePresetId: string; tagline: string };
}

/**
 * Creates a complete, empty Site - restaurant row, page configs, brand, website (draft), homepage, platform
 * subdomain, reservation availability and page content - shared by signup and "Add location". Does not save.
 */
export function provisionSite(input: ProvisionSiteInput): Restaurant {
  const now = nowIso();
  const siteId = nextId('site');
  const { name, slug, vertical } = input;
  const address = input.address ?? null;
  const tagline = input.branding?.tagline ?? '';
  const modules = input.modules ?? VERTICAL_MODULE_DEFAULTS[vertical].map(({ module, navLabel, enabled }) => ({ module, navLabel, enabled }));

  const site: Restaurant = {
    id: siteId,
    organizationId: input.organizationId,
    slug,
    name,
    ownerUserId: input.ownerUserId,
    status: 'active',
    vertical,
    address,
    brandingBadgeEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
  db.data.restaurants.push(site);

  db.data.pageConfigs.push(
    ...modules.map((m, order) => ({
      id: `pageconfig_${siteId}_${m.module}`,
      restaurantId: siteId,
      module: m.module,
      enabled: m.enabled,
      navLabel: m.navLabel,
      order,
      templateVariant: defaultTemplateVariant(vertical, m.module),
      createdAt: now,
      updatedAt: now,
    })),
  );

  const brandSettings: BrandSettings = {
    restaurantId: siteId,
    restaurantName: name,
    tagline,
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: input.branding?.themePresetId ?? 'dusty-gold',
    primaryFont: 'Inter',
    headingFont: 'Playfair Display',
    fontWeight: 'regular',
    buttonStyle: 'rounded',
    borderRadius: 'md',
    socialLinks: {},
    contact: { phone: '', email: input.ownerEmail, address: formatAddress(address) },
    description: tagline,
    cuisineType: '',
    businessHours: WEEK_DAYS.map((day) => ({ day, isClosed: false, openTime: '09:00', closeTime: '18:00' })),
    createdAt: now,
    updatedAt: now,
  };
  db.data.brand[siteId] = { draft: brandSettings, published: brandSettings };

  db.data.website[siteId] = {
    restaurantId: siteId,
    publishStatus: 'draft',
    publishedAt: null,
    seoTitle: name,
    seoDescription: tagline,
    createdAt: now,
    updatedAt: now,
  };

  const heroSection: HomepageSection = {
    id: nextId('section'),
    restaurantId: siteId,
    type: 'hero',
    order: 0,
    visible: true,
    templateVariant: 'a',
    content: {
      heading: name,
      description: tagline || 'Welcome to our new site - built in minutes.',
      buttonText: 'Get Started',
      buttonLink: '#/menu',
      backgroundMediaId: null,
      overlayOpacity: 40,
    },
    updatedAt: now,
  };
  const homepage: Homepage = {
    restaurantId: siteId,
    status: 'draft',
    sections: buildStarterSections(siteId, now, heroSection, {
      heroHeading: name,
      heroDescription: '',
      aboutEyebrow: 'Our Story',
      aboutHeading: `About ${name}`,
      aboutDescription: tagline || 'Tell your customers what makes you different.',
      featuredHeading: 'Featured',
      galleryHeading: 'Gallery',
      offersHeading: 'Special Offers',
      testimonialsHeading: 'What People Say',
      testimonials: [],
    }),
  };
  db.data.homepage[siteId] = { draft: homepage, published: homepage };

  db.data.domainMappings.push({
    id: nextId('domain'),
    restaurantId: siteId,
    type: 'platform_subdomain',
    hostname: `${slug}.ourplatform.com`,
    recordType: 'CNAME',
    recordName: '@',
    recordValue: `${slug}.ourplatform.com`,
    verificationStatus: 'verified',
    sslStatus: 'issued',
    createdAt: now,
    updatedAt: now,
  });

  const availability: ReservationAvailabilitySettings = {
    restaurantId: siteId,
    days: WEEK_DAYS.map((day) => ({
      day,
      isClosed: false,
      openTime: '09:00',
      closeTime: '21:00',
      slotDurationMins: 60,
      maxPerSlot: 4,
      slots: [],
    })),
    blockedDates: [],
  };
  db.data.reservationAvailability[siteId] = availability;

  db.data.pageContent[siteId] = { draft: {}, published: {} };

  return site;
}

export interface CopySiteOptions {
  branding: boolean;
  menu: boolean;
  reservations: boolean;
}

/** Rewrites every string equal to a copied document's old id so it points at the copy (mirrors the backend's `_remap`). */
function remap<T>(value: T, ids: Map<string, string>): T {
  if (Array.isArray(value)) return value.map((entry) => remap(entry, ids)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, remap(entry, ids)])) as T;
  }
  if (typeof value === 'string' && ids.has(value)) return ids.get(value) as T;
  return value;
}

/** Location-section overrides describe the source outlet's address/map, so they never carry over. */
const OUTLET_SPECIFIC_SECTION_FIELDS = ['addressOverride', 'mapEmbedUrlOverride'];

function copySectionContent<T extends object>(content: T, keepMenuRefs: boolean): T {
  const next: Record<string, unknown> = Object.fromEntries(
    Object.entries(content ?? {}).filter(([key]) => !OUTLET_SPECIFIC_SECTION_FIELDS.includes(key)),
  );
  if (!keepMenuRefs) {
    for (const field of ['selectedItemIds', 'selectedOfferIds']) {
      if (field in next) next[field] = [];
    }
  }
  return next as T;
}

/**
 * Copies the selected parts of `sourceId`'s set-up into the freshly provisioned `targetId` (same Org). Only
 * configuration is copied - never reservations, orders, members, slug, address or map location. Does not save.
 */
export function copySiteSetup(sourceId: string, targetId: string, options: CopySiteOptions, addressText: string) {
  const now = nowIso();
  const ids = new Map<string, string>();
  const data = db.data;

  const media = options.branding || options.menu ? data.media.filter((m) => m.restaurantId === sourceId) : [];
  const categories = options.menu ? data.categories.filter((c) => c.restaurantId === sourceId && !c.deletedAt) : [];
  const items = options.menu ? data.items.filter((i) => i.restaurantId === sourceId && !i.deletedAt) : [];
  const addons = options.menu ? data.addons.filter((a) => a.restaurantId === sourceId) : [];
  const offers = options.menu ? data.offers.filter((o) => o.restaurantId === sourceId) : [];

  // Allocate every new id up front - items, offers and homepage sections reference each other.
  for (const [prefix, docs] of [['media', media], ['cat', categories], ['item', items], ['addon', addons], ['offer', offers]] as const) {
    for (const doc of docs) ids.set(doc.id, nextId(prefix));
  }

  const clone = <T extends { id: string; restaurantId: string; createdAt: string; updatedAt: string }>(doc: T): T => ({
    ...remap(structuredClone(doc), ids),
    id: ids.get(doc.id) as string,
    restaurantId: targetId,
    createdAt: now,
    updatedAt: now,
  });

  data.media.push(...media.map(clone));
  data.categories.push(...categories.map(clone));
  data.items.push(...items.map(clone));
  data.addons.push(...addons.map(clone));
  data.offers.push(...offers.map(clone));

  if (options.branding) copyBranding(sourceId, targetId, ids, addressText, options.menu, now);
  if (options.reservations) {
    const source = data.reservationAvailability[sourceId];
    if (source) {
      data.reservationAvailability[targetId] = { ...data.reservationAvailability[targetId], restaurantId: targetId, days: structuredClone(source.days) };
    }
  }
}

function copyBranding(sourceId: string, targetId: string, ids: Map<string, string>, addressText: string, keepMenuRefs: boolean, now: string) {
  const data = db.data;

  const brand = data.brand[sourceId];
  if (brand) {
    const copyVersion = (settings: BrandSettings): BrandSettings => {
      const next = remap(structuredClone(settings), ids);
      // The map pin and embed describe the source outlet's premises.
      const { mapEmbedUrl: _mapEmbedUrl, latitude: _latitude, longitude: _longitude, ...contact } = next.contact ?? { phone: '', email: '', address: '' };
      return { ...next, restaurantId: targetId, contact: { ...contact, address: addressText }, updatedAt: now };
    };
    data.brand[targetId] = { draft: copyVersion(brand.draft), published: copyVersion(brand.published) };
  }

  for (const config of data.pageConfigs.filter((p) => p.restaurantId === sourceId)) {
    const target = data.pageConfigs.find((p) => p.restaurantId === targetId && p.module === config.module);
    if (!target) continue;
    Object.assign(target, {
      navLabel: config.navLabel,
      enabled: config.enabled,
      order: config.order,
      templateVariant: config.templateVariant,
      updatedAt: now,
    });
  }

  const homepage = data.homepage[sourceId];
  if (homepage) {
    // Draft and published share section ids, so give each one a single new id used by both versions.
    for (const section of [...homepage.draft.sections, ...homepage.published.sections]) {
      if (!ids.has(section.id)) ids.set(section.id, nextId('section'));
    }
    const copyVersion = (version: Homepage): Homepage => ({
      ...version,
      restaurantId: targetId,
      sections: version.sections.map((section) => {
        const next = remap(structuredClone(section), ids);
        return { ...next, restaurantId: targetId, content: copySectionContent(next.content, keepMenuRefs), updatedAt: now } as HomepageSection;
      }),
    });
    data.homepage[targetId] = { draft: copyVersion(homepage.draft), published: copyVersion(homepage.published) };
  }

  const content = data.pageContent[sourceId];
  if (content) {
    data.pageContent[targetId] = { draft: remap(structuredClone(content.draft), ids), published: remap(structuredClone(content.published), ids) };
  }

  const website = data.website[sourceId];
  const targetWebsite = data.website[targetId];
  if (website && targetWebsite) {
    // The new outlet stays a draft: the owner publishes it once its own address and details are right.
    if (website.seoTitle !== undefined) targetWebsite.seoTitle = website.seoTitle;
    if (website.seoDescription !== undefined) targetWebsite.seoDescription = website.seoDescription;
  }
}
