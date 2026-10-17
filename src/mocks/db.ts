import type {
  Addon,
  BrandSettings,
  DomainMapping,
  Homepage,
  MediaAsset,
  Member,
  MemberCheckIn,
  MembershipPlan,
  MenuCategory,
  MenuItem,
  Offer,
  Order,
  Organization,
  PageConfig,
  Reservation,
  ReservationAvailabilitySettings,
  Restaurant,
  User,
  PageContentMap,
  WebsiteSettings,
} from '../types';

export interface Versioned<T> {
  draft: T;
  published: T;
}

export interface MockDbShape {
  organizations: Organization[];
  users: User[];
  restaurants: Restaurant[];
  brand: Record<string, Versioned<BrandSettings>>;
  website: Record<string, WebsiteSettings>;
  homepage: Record<string, Versioned<Homepage>>;
  media: MediaAsset[];
  categories: MenuCategory[];
  items: MenuItem[];
  addons: Addon[];
  offers: Offer[];
  orders: Order[];
  reservations: Reservation[];
  reservationAvailability: Record<string, ReservationAvailabilitySettings>;
  pageConfigs: PageConfig[];
  membershipPlans: MembershipPlan[];
  members: Member[];
  memberCheckIns: MemberCheckIn[];
  domainMappings: DomainMapping[];
  pageContent: Record<string, Versioned<PageContentMap>>;
}

const STORAGE_KEY = 'lumiere-cms-mock-db-v15';

function emptyDb(): MockDbShape {
  return {
    organizations: [],
    users: [],
    restaurants: [],
    brand: {},
    website: {},
    homepage: {},
    media: [],
    categories: [],
    items: [],
    addons: [],
    offers: [],
    orders: [],
    reservations: [],
    reservationAvailability: {},
    pageConfigs: [],
    membershipPlans: [],
    members: [],
    memberCheckIns: [],
    domainMappings: [],
    pageContent: {},
  };
}

function load(): MockDbShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw);
    return { ...emptyDb(), ...parsed };
  } catch {
    return emptyDb();
  }
}

class MockDb {
  data: MockDbShape = load();

  constructor() {
    // Each document (admin tab, the Site Editor's preview iframe, other tabs) runs its own copy of this
    // mock DB. `storage` fires in the *other* documents whenever one of them saves, so re-read to stay in
    // sync - otherwise the live preview would keep serving the content it loaded with.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) this.data = load();
    });
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore quota errors (e.g. large base64 media) - non-fatal for demo purposes
    }
  }

  reset(next: MockDbShape) {
    this.data = next;
    this.save();
  }

  isEmpty() {
    return this.data.restaurants.length === 0;
  }
}

export const db = new MockDb();

export function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
