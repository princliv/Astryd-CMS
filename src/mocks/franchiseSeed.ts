/**
 * Demo multi-location franchise: "Ember & Oak", one Organization running three restaurant outlets, each with its
 * own address, website, menu (shared signatures, local prices and an outlet exclusive), offers, hours, bookings
 * and orders - plus an Owner who sees every outlet and managers limited to theirs.
 */
import type {
  Addon,
  BrandSettings,
  MediaAsset,
  DomainMapping,
  Homepage,
  HomepageSection,
  MenuCategory,
  MenuItem,
  Offer,
  Order,
  OrderLineItem,
  OrderServiceType,
  OrderStatus,
  Organization,
  PageConfig,
  PlatformModule,
  Reservation,
  ReservationAvailabilitySettings,
  ReservationStatus,
  Restaurant,
  SiteAddress,
  User,
  WebsiteSettings,
  WeekDay,
} from '../types';
import type { MockDbShape, Versioned } from './db';

export const FRANCHISE_ORGANIZATION_ID = 'org_emberoak';
export const FRANCHISE_ORGANIZATION_CODE = 'EMBEROAK';
export const FRANCHISE_OWNER_EMAIL = 'owner@emberoak.com';

/** Unsplash photos (checked to load and to show their subject), like the other vertical demos use. */
const photo = (id: string, w = 1200) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
const EMBER_IMAGES = {
  burger: photo('photo-1568901346375-23c9450c58cd'),
  pizza: photo('photo-1513104890138-7c749659a591'),
  wings: photo('photo-1567620832903-9fc6debc209f'),
  burrata: photo('photo-1504674900247-0877df9cc836'),
  ribeye: photo('photo-1600891964092-4316c288032e'),
  pasta: photo('photo-1621996346565-e3dbc646d9a9'),
  dessert: photo('photo-1565958011703-44f9829ba187'),
  tomahawk: photo('photo-1558030006-450675393462'),
  brisket: photo('photo-1544025162-d76694265947'),
  chicken: photo('photo-1606728035253-49e8a23146de'),
  grill: photo('photo-1529193591184-b1d58069ecdd', 1600),
  chef: photo('photo-1556910103-1c02745aae4d', 800),
  diningSoho: photo('photo-1517248135467-4c7edcad34c4', 1920),
  barWilliamsburg: photo('photo-1514933651103-005eec06c04b', 1920),
  diningHoboken: photo('photo-1552566626-52f8b828add9', 1920),
  hall: photo('photo-1555396273-367ea4eb4db5', 1600),
  stairsBar: photo('photo-1590846406792-0adc7f938f1d', 1600),
  sharing: photo('photo-1466978913421-dad2ebd01d17', 1600),
  terrace: photo('photo-1559339352-11d035aa65de', 1600),
  smokedWings: photo('photo-1527477396000-e27163b481c2', 1600),
};
type ImageKey = keyof typeof EMBER_IMAGES;

const GALLERY: Array<[ImageKey, string]> = [
  ['hall', 'The main room - open kitchen, oak-fired grill and long communal tables.'],
  ['grill', 'Everything meets the fire: oak embers, cast iron and smoke.'],
  ['sharing', 'Plates made for the middle of the table.'],
  ['stairsBar', 'The bar, pouring house cocktails until late.'],
  ['smokedWings', 'Oak-smoked wings, straight off the grill.'],
  ['terrace', 'Outdoor seating when the weather allows.'],
];

interface OutletDef {
  id: string;
  slug: string;
  name: string;
  neighbourhood: string;
  address: SiteAddress;
  phone: string;
  email: string;
  tagline: string;
  heroImage: ImageKey;
  aboutImage: ImageKey;
  /** Added to every shared dish's base price - outlets price for their own market. */
  priceDelta: number;
  exclusive: { name: string; description: string; price: number; category: string; image: ImageKey };
  offer: { name: string; discountValue: number; type: Offer['type']; cta: string };
  hours: { weekday: [string, string]; friSat: [string, string]; sunday: [string, string] };
  guests: Array<[string, string]>;
}

const OUTLETS: OutletDef[] = [
  {
    id: 'site_emberoak_soho',
    slug: 'ember-oak-soho',
    name: 'Ember & Oak – SoHo',
    neighbourhood: 'SoHo, Manhattan',
    address: { line1: '120 Spring Street', line2: '', city: 'New York', region: 'NY', postalCode: '10012', country: 'United States' },
    phone: '+1 (212) 555-0181',
    email: 'soho@emberoak.com',
    tagline: 'The flagship wood-fire grill in SoHo',
    heroImage: 'diningSoho',
    aboutImage: 'grill',
    priceDelta: 2,
    exclusive: { name: 'Spring Street Tomahawk (1kg)', description: 'Dry-aged 45 days, carved tableside over oak embers - built for two.', price: 128, category: 'Steaks', image: 'tomahawk' },
    offer: { name: 'Weekday Lunch Prix Fixe', discountValue: 15, type: 'percentage', cta: 'Book Lunch' },
    hours: { weekday: ['11:30', '23:00'], friSat: ['11:30', '00:00'], sunday: ['11:00', '22:00'] },
    guests: [['Hannah Brooks', 'hannah.b@example.com'], ['Leo Martinez', 'leo.m@example.com'], ['Grace Kim', 'grace.k@example.com'], ['Samuel Ortiz', 'samuel.o@example.com']],
  },
  {
    id: 'site_emberoak_wburg',
    slug: 'ember-oak-williamsburg',
    name: 'Ember & Oak – Williamsburg',
    neighbourhood: 'Williamsburg, Brooklyn',
    address: { line1: '85 North 6th Street', line2: '', city: 'Brooklyn', region: 'NY', postalCode: '11249', country: 'United States' },
    phone: '+1 (718) 555-0142',
    email: 'williamsburg@emberoak.com',
    tagline: 'Brooklyn smokehouse and rooftop bar',
    heroImage: 'barWilliamsburg',
    aboutImage: 'brisket',
    priceDelta: 0,
    exclusive: { name: 'Kent Ave Smoked Brisket', description: '14-hour post-oak brisket, pickled onions, burnt-end beans and Texas toast.', price: 32, category: 'Mains', image: 'brisket' },
    offer: { name: 'Rooftop Happy Hour', discountValue: 25, type: 'percentage', cta: 'Order Now' },
    hours: { weekday: ['12:00', '23:00'], friSat: ['12:00', '01:00'], sunday: ['11:00', '22:00'] },
    guests: [['Nia Thompson', 'nia.t@example.com'], ['Ethan Cole', 'ethan.c@example.com'], ['Maya Patel', 'maya.p@example.com'], ['Lucas Wright', 'lucas.w@example.com']],
  },
  {
    id: 'site_emberoak_hoboken',
    slug: 'ember-oak-hoboken',
    name: 'Ember & Oak – Hoboken',
    neighbourhood: 'Hoboken, New Jersey',
    address: { line1: '301 Washington Street', line2: '', city: 'Hoboken', region: 'NJ', postalCode: '07030', country: 'United States' },
    phone: '+1 (201) 555-0117',
    email: 'hoboken@emberoak.com',
    tagline: 'Family wood-fire grill on Washington Street',
    heroImage: 'diningHoboken',
    aboutImage: 'chicken',
    priceDelta: -1,
    exclusive: { name: 'Hoboken Hot Honey Chicken', description: 'Brick-pressed half chicken, Calabrian hot honey and charred lemon.', price: 27, category: 'Mains', image: 'chicken' },
    offer: { name: 'Family Sunday Feast', discountValue: 10, type: 'fixed', cta: 'Reserve a Table' },
    hours: { weekday: ['11:30', '22:00'], friSat: ['11:30', '23:00'], sunday: ['11:00', '21:00'] },
    guests: [['Olivia Russo', 'olivia.r@example.com'], ['Noah Bennett', 'noah.b@example.com'], ['Ava Sullivan', 'ava.s@example.com'], ['Jack Moreno', 'jack.m@example.com']],
  },
];

const SHARED_DISHES: Array<{ key: string; name: string; description: string; price: number; category: string; image: ImageKey; featured?: boolean; veg?: boolean }> = [
  { key: 'ember-burger', name: 'Ember Smash Burger', description: 'Two oak-grilled patties, aged cheddar, charred onion jam and house pickles on a potato bun.', price: 19, category: 'Burgers', image: 'burger', featured: true },
  { key: 'wood-fire-margherita', name: 'Wood-Fired Margherita', description: '48-hour dough, San Marzano tomato, fior di latte and basil, blistered at 900°F.', price: 18, category: 'Pizza', image: 'pizza', veg: true },
  { key: 'smoked-wings', name: 'Oak-Smoked Wings', description: 'Smoked then charred, tossed in maple-chipotle glaze, with blue cheese dip.', price: 16, category: 'Starters', image: 'wings', featured: true },
  { key: 'burrata', name: 'Ember Burrata', description: 'Grilled stone fruit, burrata, hazelnut dukkah and aged balsamic.', price: 17, category: 'Starters', image: 'burrata', veg: true },
  { key: 'ribeye', name: 'Oak-Grilled Ribeye (14oz)', description: 'Prime ribeye over oak embers, bone-marrow butter and smoked salt.', price: 54, category: 'Steaks', image: 'ribeye', featured: true },
  { key: 'mushroom-pasta', name: 'Charred Mushroom Rigatoni', description: 'Fire-roasted wild mushrooms, brown butter, sage and parmesan.', price: 24, category: 'Mains', image: 'pasta', veg: true },
  { key: 'skillet-cookie', name: 'Cast-Iron Skillet Cookie', description: 'Baked to order in the wood oven, with smoked-salt caramel and vanilla ice cream.', price: 12, category: 'Desserts', image: 'dessert', veg: true },
];

const CATEGORIES = ['Starters', 'Burgers', 'Pizza', 'Mains', 'Steaks', 'Desserts'];
const WEEK_DAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const isoDate = (daysFromToday: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

export function buildFranchiseSeed(now: string): Partial<MockDbShape> & {
  organizations: Organization[];
  users: User[];
  restaurants: Restaurant[];
} {
  const [soho, williamsburg, hoboken] = OUTLETS;

  const organizations: Organization[] = [{ id: FRANCHISE_ORGANIZATION_ID, code: FRANCHISE_ORGANIZATION_CODE, name: 'Ember & Oak Hospitality', createdAt: now, updatedAt: now }];
  const users: User[] = [
    { id: 'user_emberoak_owner', organizationId: FRANCHISE_ORGANIZATION_ID, email: FRANCHISE_OWNER_EMAIL, name: 'Daniel Okafor', role: 'owner', restaurantId: soho.id, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_emberoak_soho_mgr', organizationId: FRANCHISE_ORGANIZATION_ID, email: 'soho.manager@emberoak.com', name: 'Rachel Lin', role: 'staff', restaurantId: soho.id, siteAccess: [soho.id], isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_emberoak_area_mgr', organizationId: FRANCHISE_ORGANIZATION_ID, email: 'area.manager@emberoak.com', name: 'Marcus Hale', role: 'staff', restaurantId: williamsburg.id, siteAccess: [williamsburg.id, hoboken.id], isActive: true, createdAt: now, updatedAt: now },
  ];

  const restaurants: Restaurant[] = OUTLETS.map((o) => ({
    id: o.id, organizationId: FRANCHISE_ORGANIZATION_ID, slug: o.slug, name: o.name, ownerUserId: 'user_emberoak_owner',
    status: 'active', vertical: 'restaurant', address: o.address, brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  }));

  const formatAddress = (a: SiteAddress) => [a.line1, a.line2, `${a.city} ${a.postalCode}`, a.region, a.country].filter(Boolean).join(', ');

  const brand: Record<string, Versioned<BrandSettings>> = {};
  const website: Record<string, WebsiteSettings> = {};
  const homepage: Record<string, Versioned<Homepage>> = {};
  const reservationAvailability: Record<string, ReservationAvailabilitySettings> = {};
  const pageContent: MockDbShape['pageContent'] = {};
  const categories: MenuCategory[] = [];
  const items: MenuItem[] = [];
  const addons: Addon[] = [];
  const offers: Offer[] = [];
  const orders: Order[] = [];
  const reservations: Reservation[] = [];
  const pageConfigs: PageConfig[] = [];
  const domainMappings: DomainMapping[] = [];
  const media: MediaAsset[] = [];

  OUTLETS.forEach((o, outletIndex) => {
    const hoursFor = (day: WeekDay): [string, string] => (day === 'fri' || day === 'sat' ? o.hours.friSat : day === 'sun' ? o.hours.sunday : o.hours.weekday);
    const settings: BrandSettings = {
      restaurantId: o.id,
      restaurantName: 'Ember & Oak',
      tagline: o.tagline,
      logoMediaId: null,
      faviconMediaId: null,
      themePresetId: 'espresso',
      primaryFont: 'Inter',
      headingFont: 'Playfair Display',
      fontWeight: 'medium',
      buttonStyle: 'rounded',
      borderRadius: 'lg',
      navPosition: 'right',
      socialLinks: { instagram: 'https://instagram.com/emberandoak', facebook: '', whatsapp: '' },
      // Street, neighbourhood, state - the homepage shows the neighbourhood from this line.
      contact: { phone: o.phone, email: o.email, address: `${o.address.line1}, ${o.neighbourhood.split(',')[0]}, ${o.address.region} ${o.address.postalCode}` },
      description: `Ember & Oak ${o.neighbourhood} - wood-fire cooking, local produce and a menu that changes with what comes off the grill. One of three Ember & Oak locations.`,
      cuisineType: 'Wood-Fire Grill',
      businessHours: WEEK_DAYS.map((day) => ({ day, isClosed: false, openTime: hoursFor(day)[0], closeTime: hoursFor(day)[1] })),
      createdAt: now,
      updatedAt: now,
    };
    brand[o.id] = { draft: { ...settings }, published: { ...settings } };

    website[o.id] = {
      restaurantId: o.id, publishStatus: 'published', publishedAt: now,
      seoTitle: `${o.name} | Wood-Fire Grill`, seoDescription: `Wood-fire grill and bar in ${o.neighbourhood}. Book a table or order online.`,
      createdAt: now, updatedAt: now,
    };

    reservationAvailability[o.id] = {
      restaurantId: o.id,
      days: WEEK_DAYS.map((day) => ({ day, isClosed: false, openTime: hoursFor(day)[0], closeTime: hoursFor(day)[1] === '00:00' || hoursFor(day)[1] === '01:00' ? '23:30' : hoursFor(day)[1], slotDurationMins: 30, maxPerSlot: 6, slots: [] })),
      blockedDates: [],
    };
    // The homepage info cards describe this outlet, not the platform's fine-dining defaults.
    const landing = {
      locationFallback: o.neighbourhood,
      openStatus: 'Open today',
      card1Rows: [
        { id: 'r1', label: 'Outdoor Seating', value: outletIndex === 1 ? 'Rooftop bar' : 'Patio' },
        { id: 'r2', label: 'Private Dining', value: 'Up to 12 guests' },
        { id: 'r3', label: 'Wheelchair Access', value: 'Fully accessible' },
        { id: 'r4', label: 'Kids', value: outletIndex === 2 ? 'Kids menu & high chairs' : 'Welcome' },
      ],
      card2Rows: [
        { id: 'r1', label: 'Cuisine', value: 'Wood-fire grill' },
        { id: 'r2', label: 'Dress Code', value: 'Casual' },
        { id: 'r3', label: 'Payment', value: 'All major cards' },
        { id: 'r4', label: 'Walk-ins', value: 'Bar seats held nightly' },
      ],
    };
    pageContent[o.id] = { draft: { landing }, published: { landing } };

    const catId = (name: string) => `cat_${o.id}_${name.toLowerCase()}`;
    CATEGORIES.forEach((name, displayOrder) => {
      categories.push({ id: catId(name), restaurantId: o.id, name, displayOrder, isVisible: true, deletedAt: null, createdAt: now, updatedAt: now });
    });

    const outletAddons: Addon[] = [
      { id: `addon_${o.id}_fries`, restaurantId: o.id, name: 'Smoked Salt Fries', price: 7, description: 'Hand-cut, twice fried', isVeg: true, isAvailable: true, group: 'Sides', groupSelection: 'multiple', createdAt: now, updatedAt: now },
      { id: `addon_${o.id}_bacon`, restaurantId: o.id, name: 'Maple Bacon', price: 4, description: 'Thick-cut, oak-smoked', isAvailable: true, group: 'Extras', groupSelection: 'multiple', createdAt: now, updatedAt: now },
      { id: `addon_${o.id}_lemonade`, restaurantId: o.id, name: 'Charred Lemonade', price: 6, description: 'Grilled lemons, honey, soda', isVeg: true, isAvailable: true, group: 'Drinks', groupSelection: 'multiple', createdAt: now, updatedAt: now },
    ];
    addons.push(...outletAddons);

    const dishes = [...SHARED_DISHES, { key: 'exclusive', ...o.exclusive, featured: true, veg: false }];
    const outletItems: MenuItem[] = dishes.map((dish, displayOrder) => ({
      id: `item_${o.id}_${dish.key}`,
      restaurantId: o.id,
      categoryId: catId(dish.category),
      name: dish.name,
      description: dish.description,
      price: dish.key === 'exclusive' ? dish.price : dish.price + o.priceDelta,
      imageMediaId: null,
      imageUrl: EMBER_IMAGES[dish.image],
      foodType: dish.veg ? 'veg' : 'non_veg',
      tags: dish.key === 'exclusive' ? [`Only at ${o.neighbourhood.split(',')[0]}`] : dish.featured ? ['Signature'] : [],
      prepTimeMinutes: 15,
      rating: 4.7,
      reviewCount: 120 + displayOrder * 37,
      isAvailable: true,
      isFeatured: Boolean(dish.featured),
      displayOrder,
      variants: [],
      addonIds: dish.category === 'Burgers' || dish.category === 'Mains' ? outletAddons.map((a) => a.id) : [],
      activeOfferId: dish.key === 'ember-burger' ? `offer_${o.id}` : null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }));
    items.push(...outletItems);

    offers.push({
      id: `offer_${o.id}`, restaurantId: o.id, name: o.offer.name, type: o.offer.type, discountValue: o.offer.discountValue,
      startDate: now, endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), isActive: true,
      appliesToItemIds: [outletItems[0].id], appliesToCategoryIds: [], cta: o.offer.cta, createdAt: now, updatedAt: now,
    });

    // Each outlet keeps its own media library; the photos are shared, the hero and story are local.
    const mediaId = (key: string) => `media_${o.id}_${key}`;
    const addMedia = (key: string, image: ImageKey, altText: string) =>
      media.push({ id: mediaId(key), restaurantId: o.id, fileUrl: EMBER_IMAGES[image], fileType: 'image', mimeType: 'image/jpeg', fileName: `${key}.jpg`, fileSizeBytes: 0, altText, folder: 'images', createdAt: now, updatedAt: now });
    addMedia('hero', o.heroImage, `Ember & Oak ${o.neighbourhood}`);
    addMedia('about', o.aboutImage, 'Cooking over the oak fire');
    addMedia('chef', 'chef', 'Chef Theo Marsh in the kitchen');
    GALLERY.forEach(([image, caption], n) => addMedia(`gallery_${n}`, image, caption));

    const area = o.neighbourhood.split(',')[0];
    const base = { restaurantId: o.id, updatedAt: now, templateVariant: 'a' as const, visible: true };
    const sections: HomepageSection[] = [
      {
        ...base, id: `section_${o.id}_hero`, type: 'hero', order: 1,
        content: {
          eyebrow: o.neighbourhood, heading: 'Ember & Oak', description: `${o.tagline}. Cooked over live oak fire, every night.`,
          buttonText: 'Reserve a Table', buttonLink: '/reservations', secondaryButtonText: 'Order Online', secondaryButtonLink: '/menu',
          backgroundMediaId: mediaId('hero'), overlayOpacity: 55,
        },
      },
      {
        ...base, id: `section_${o.id}_about`, type: 'about', order: 2,
        content: {
          eyebrow: 'Our fire',
          heading: `Live fire, ${area} soul.`,
          description: 'Everything on the menu meets the oak fire - from the smash burger to the tomahawk. Three neighbourhoods, one grill, the same obsession with smoke, char and generous plates.',
          imageMediaId: mediaId('about'),
          quote: 'Good wood, real fire and time - that is the whole recipe.',
          chefName: 'Chef Theo Marsh',
          chefQuote: 'We cook the way people have cooked for thousands of years: over embers, with patience. The oak does half the work.',
          chefBio: 'Theo opened the first Ember & Oak in SoHo after a decade in Texas smokehouses and Basque grill kitchens. He still runs the fire in every new location for its first month.',
          chefImageMediaId: mediaId('chef'),
        },
      },
      {
        ...base, id: `section_${o.id}_featured_menu`, type: 'featured_menu', order: 3,
        content: {
          eyebrow: 'From the grill', heading: 'Signature Dishes', description: `Our most-ordered plates at Ember & Oak ${area} - including one you will only find here.`,
          selectedItemIds: [outletItems[0].id, outletItems[2].id, outletItems[4].id, outletItems[outletItems.length - 1].id],
        },
      },
      {
        ...base, id: `section_${o.id}_gallery`, type: 'gallery', order: 4,
        content: { eyebrow: 'Inside', heading: `Ember & Oak ${area}`, description: 'Smoke, fire and a full room.', images: GALLERY.map(([, caption], n) => ({ mediaId: mediaId(`gallery_${n}`), caption, order: n })) },
      },
      {
        ...base, id: `section_${o.id}_offers`, type: 'offers', order: 5,
        content: { eyebrow: 'This week', heading: 'Offers', description: `What is on at Ember & Oak ${area}.`, selectedOfferIds: [`offer_${o.id}`] },
      },
      {
        ...base, id: `section_${o.id}_testimonials`, type: 'testimonials', order: 6,
        content: {
          eyebrow: 'Guest stories', heading: 'What our guests say',
          testimonials: [
            { id: `testimonial_${o.id}_0`, customerName: o.guests[0][0], quote: 'The ribeye was perfect and the room has such a warm, buzzy feel.', rating: 5, order: 0 },
            { id: `testimonial_${o.id}_1`, customerName: o.guests[1][0], quote: 'Best smash burger in the city - we keep coming back.', rating: 5, order: 1 },
            { id: `testimonial_${o.id}_2`, customerName: o.guests[2][0], quote: `Booked the private room for a birthday - the ${area} team made it special.`, rating: 5, order: 2 },
          ],
        },
      },
      { ...base, id: `section_${o.id}_location`, type: 'location', order: 7, content: { heading: 'Find Us', showHoursTable: true } },
    ];
    homepage[o.id] = {
      draft: { restaurantId: o.id, status: 'draft', sections: sections.map((section) => ({ ...section })) },
      published: { restaurantId: o.id, status: 'published', sections },
    };

    const line = (item: MenuItem, quantity: number, extra: Addon[] = []): OrderLineItem => {
      const unitPrice = item.price + extra.reduce((sum, a) => sum + a.price, 0);
      return { itemId: item.id, name: item.name, quantity, unitPrice, lineTotal: unitPrice * quantity, addons: extra.map((a) => ({ id: a.id, name: a.name, price: a.price })) };
    };
    const order = (n: number, status: OrderStatus, service: OrderServiceType, lines: OrderLineItem[], placed: number, updated = placed): Order => {
      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const taxes = Math.round(subtotal * 0.08875 * 100) / 100;
      const deliveryFee = service === 'delivery' ? 5 : 0;
      const [guestName, guestEmail] = o.guests[n % o.guests.length];
      return {
        id: `order_${o.id}_${n}`, restaurantId: o.id, orderNumber: String(3000 + outletIndex * 100 + n), status, service, paymentMethod: 'card',
        customerName: guestName, customerPhone: o.phone.replace(/\d{4}$/, String(1000 + n)), customerEmail: guestEmail,
        address: service === 'delivery' ? formatAddress({ ...o.address, line1: `${40 + n * 7} ${o.address.line1.split(' ').slice(1).join(' ')}` }) : undefined,
        items: lines, subtotal, taxes, deliveryFee, total: subtotal + taxes + deliveryFee,
        placedAt: minutesAgo(placed), statusUpdatedAt: minutesAgo(updated), createdAt: minutesAgo(placed), updatedAt: minutesAgo(updated),
      };
    };
    orders.push(
      order(1, 'paid', 'pickup', [line(outletItems[0], 2, outletAddons.slice(0, 1)), line(outletItems[2], 1)], 4 + outletIndex),
      order(2, 'preparing', 'delivery', [line(outletItems[4], 1), line(outletItems[6], 2)], 15 + outletIndex * 3, 8),
      order(3, 'ready', 'pickup', [line(outletItems[outletItems.length - 1], 1)], 22 + outletIndex, 3),
      order(4, 'completed', 'delivery', [line(outletItems[1], 2), line(outletItems[3], 1)], 140 + outletIndex * 20, 95),
    );

    const booking = (n: number, status: ReservationStatus, days: number, time: string, party: number, seating: string, placed: number, notes?: string): Reservation => {
      const [guestName, guestEmail] = o.guests[n % o.guests.length];
      return {
        id: `reservation_${o.id}_${n}`, restaurantId: o.id, confirmationCode: `EMB-${(outletIndex + 1) * 1000 + n * 37}`, status,
        date: isoDate(days), timeSlot: time, partySize: party, seatingPreference: seating,
        guestName, guestEmail, guestPhone: o.phone.replace(/\d{4}$/, String(2000 + n)), specialRequests: notes, newsletterOptIn: n % 2 === 0,
        placedAt: minutesAgo(placed), createdAt: minutesAgo(placed), updatedAt: minutesAgo(placed),
      };
    };
    reservations.push(
      booking(1, 'confirmed', 0, outletIndex === 0 ? '19:30' : '18:30', 2, 'Indoor', 60, 'Window seat if possible.'),
      booking(2, 'seated', 0, '13:00', 4, 'Outdoor', 180),
      booking(3, 'confirmed', 2 + outletIndex, '20:00', 6, 'Private', 300, 'Birthday - bringing a cake.'),
      booking(4, 'completed', -1, '19:00', 3, 'The Bar', 2000),
      booking(5, outletIndex === 1 ? 'no_show' : 'cancelled', -2, '21:00', 2, 'Indoor', 3200),
    );

    const configs: Array<{ module: PlatformModule; navLabel: string; enabled: boolean }> = [
      { module: 'items', navLabel: 'Menu', enabled: true },
      { module: 'catalog', navLabel: 'Order Online', enabled: true },
      { module: 'booking', navLabel: 'Reservations', enabled: true },
      { module: 'membership', navLabel: 'Membership', enabled: false },
    ];
    pageConfigs.push(...configs.map((c, order) => ({ id: `pageconfig_${o.id}_${c.module}`, restaurantId: o.id, ...c, order, templateVariant: 'a' as const, createdAt: now, updatedAt: now })));
    domainMappings.push({
      id: `domain_${o.id}_platform`, restaurantId: o.id, type: 'platform_subdomain', hostname: `${o.slug}.ourplatform.com`,
      recordType: 'CNAME', recordName: '@', recordValue: `${o.slug}.ourplatform.com`, verificationStatus: 'verified', sslStatus: 'issued', createdAt: now, updatedAt: now,
    });
  });

  return {
    organizations, users, restaurants, brand, website, homepage, media, categories, items, addons, offers, orders, reservations,
    reservationAvailability, pageConfigs, domainMappings, pageContent,
  };
}
