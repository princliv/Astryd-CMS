import { db, nowIso, type MockDbShape } from './db';
import { VERTICAL_MODULE_DEFAULTS, defaultTemplateVariant } from '../data/onboardingDefaults';
import { buildGymSeed, buildRetailSeed, buildSalonSeed, buildCoffeeSeed, buildLaundrySeed } from './seedVerticals';
import type {
  Addon,
  BrandSettings,
  DomainMapping,
  Homepage,
  HomepageSection,
  MediaAsset,
  Member,
  MemberCheckIn,
  MembershipBillingInterval,
  MembershipPlan,
  MenuCategory,
  MenuItem,
  Offer,
  Order,
  OrderLineItem,
  OrderPaymentMethod,
  OrderServiceType,
  OrderStatus,
  Organization,
  PageConfig,
  PlatformModule,
  Reservation,
  ReservationAvailabilitySettings,
  ReservationStatus,
  Restaurant,
  User,
  Vertical,
  WeekDay,
} from '../types';

export const RESTAURANT_ID = 'rest_lumiere';
export const RESTAURANT_SLUG = 'lumiere-mayfair';
/** Second demo Site under the same Org, so Phase 1's Site switcher has something real to switch between (Multi-Vertical Platform Plan §14, Phase 1). Deliberately sparse - a freshly created Site looks like this until its owner fills it in. */
export const SECOND_SITE_ID = 'rest_lumiere_nh';
export const SECOND_SITE_SLUG = 'lumiere-notting-hill';
export const ORGANIZATION_ID = 'org_lumiere';
/** Human-typed login field (Multi-Vertical Platform Plan §4) - a placeholder format pending backend's final Org ID scheme (plan §15, open question 2). */
export const ORGANIZATION_CODE = 'LUMIERE';

/** Plan §2/§6 - a Gym demo Org/Site (own login), so the platform's multi-vertical claim has a second real tenant to point at beyond Lumière's Restaurant. */
export const GYM_SITE_ID = 'site_pulsefit';
export const GYM_SITE_SLUG = 'pulsefit-downtown';
export const GYM_ORGANIZATION_ID = 'org_pulsefit';
export const GYM_ORGANIZATION_CODE = 'PULSEFIT';

/** Plan §2/§6 - a Retail demo Org/Site (own login), the third vertical. */
export const RETAIL_SITE_ID = 'site_novagoods';
export const RETAIL_SITE_SLUG = 'nova-goods';
export const RETAIL_ORGANIZATION_ID = 'org_novagoods';
export const RETAIL_ORGANIZATION_CODE = 'NOVAGOODS';

/** Plan §2/§6 - a Salon demo Org/Site (own login), the fourth vertical - a US hair, nails & skin salon. */
export const SALON_SITE_ID = 'site_sloaneco';
export const SALON_SITE_SLUG = 'sloane-and-co';
export const SALON_ORGANIZATION_ID = 'org_sloaneco';
export const SALON_ORGANIZATION_CODE = 'SLOANECO';

/** Plan §2/§6 - a Coffee Shop demo Org/Site (own login), the fifth vertical - a US specialty coffee shop. */
export const COFFEE_SITE_ID = 'site_fernwood';
export const COFFEE_SITE_SLUG = 'fernwood-coffee';
export const COFFEE_ORGANIZATION_ID = 'org_fernwood';
export const COFFEE_ORGANIZATION_CODE = 'FERNWOOD';

/** Plan §2/§6 - a Laundry demo Org/Site (own login), the sixth vertical - a US family-owned laundry & dry cleaner. */
export const LAUNDRY_SITE_ID = 'site_brightside';
export const LAUNDRY_SITE_SLUG = 'brightside-laundry';
export const LAUNDRY_ORGANIZATION_ID = 'org_brightside';
export const LAUNDRY_ORGANIZATION_CODE = 'BRIGHTSIDE';
/** Demo password accepted for every seeded account - mock auth only, never real. */
export const DEMO_PASSWORD = 'password123';

const GALLERY_SEED = [
  {
    id: 'media_gallery_1',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8ahzV-qIr22Is_b8mUE8ZmFoYSg6UIiCOEuDGEcKRIjnUPd0mPnpt4ygBsi_JGlLMaQkItlCuNo6k36T1YYd4uaU1zoVRM3qrereIuSuADm5MQUgTpS600hMNOiLD9E6waygSgdOF2hRatW5Hh48IzFShpVgUp5ABu79zo68vOQWKv1Wy949N0PUp9CAsUJg9hiAPXAjWLbS1vB6pUebHkwNWFh_Y0BJP4kaMxcSGr1xeu1AsmF41ttCSrPao62HFMy6ihibr3Vg',
    title: 'The Vault Room',
    caption: 'Private dining vault featuring mahogany table and hand-blown amber chandelier.',
  },
  {
    id: 'media_gallery_2',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ2SwfE-L4ENpw0vIUBXHTsJ5WtR_WchM-HleBOHJAKcVE2EBoTYxscGxwzwDphMvAL9Pm3bTQC8jItpGg-PcEX1N9MSqhU2utK5AyJayd_q0O_cOC9f6IAl0iRpUqomC_fV9pMHcOmnPnX0Sou3nleMjzMJkmyjHFb6knQH015fgsy3GnbPME85GyiNwRQCGkXjkwlICjSCGB3pd2zxXB7PMtsokmlyiVv3KycxRD8J9mx0S1RZFZd-YIMe1fwVXt9dw_1vBgTKw',
    title: 'Sommelier Pouring',
    caption: 'Vintage premier grand cru classé poured into thin-stemmed crystal.',
  },
  {
    id: 'media_gallery_3',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqIb_Uo23kTJpPcIMURUZmNrGyhHrLA_AkoSspLoXESUeC2-QgV1mYlBTlKppD6cilp8R3RB8mMxOlfndzPvfhL7xITN5VCYtU4icw39sQMq5p_re4-y6CvplHpd7U_bLH6AjvF_5pZvgdYCleJD2VLWxbX5KPeDhLZfgMDH3IkQEynd-x99MRLYQ26FI1narcNVF049Tj7tSmABL55PD8_mGdAhJKp7Bej6eAaI1hLCiWlXN50imkpkwNu1W9aTVnGekbswD9zQY',
    title: 'Artisanal Dessert',
    caption: 'Deconstructed chocolate sphere with gold leaf on dark slate plate.',
  },
  {
    id: 'media_gallery_4',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKPss8TPGgMf-Y8MWpZq7aApZrknob0u2vlymDMLhcYuMdNgwZXhjclHHA6gkgzQufxVduxJearT4yt3PYcPW6_kCoMg0q7Xadloi5XfMwIWLeuDMtGFvIs6hX8GkP3c0chRqFDlhm8yG_KEJzVuunyyLbzxvSI0hXAkImaPxly_M4lTDgM253D1Eo_MELJl8o7Nj0GsJZ9IxdvzVSfvVXJEAaMoUvfYR0yU_-XkvTK57-T2OdVgwsdYI7iC0mFynmdmjkuKj37EE',
    title: 'Kitchen Craftsmanship',
    caption: 'Precision garnish placement in our surgical kitchen environment.',
  },
  {
    id: 'media_gallery_5',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAwGaZwXFPwj_bW2Q-244iR4HQv3BBrLRimTlG7Zx5PXvy5wVqznhfUlSVoHqhSyDjw3sgTWooyhxQlzHVkoZPXjNdHNYUz9LW5-j7EmaI-loqCuwCt0TDoFqDvdCdYKB33SIzOS5pC-4ioszmueKo3kQ6kJS7D9865nk_NxyboX_xzvl7K0jI8beUHKgkl2cUpl7fp-h1E-KgvyBznyQiMOD9UA367j8BAHJgmODDWVVestXclKfTMumQuIOpXgt0-KHRc3JAFfM',
    title: 'Main Dining Room',
    caption: 'Panoramic golden hour lighting across soaring ceilings and crisp linens.',
  },
];

const HERO_BG_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQbyYUDRt6Ie5sV8x34REUiRO9cxq65xZQidv0ToYVkQhSkqTUhN1V8UhO9WW-PoCz9WNOvazyBRZlgnJLmMdHLbj2VxmxZziIK3bdJCegH6dRc5gFthM3376iukAp0V3CPTrFLp4PbBE6UIQsBPk1Jq8AnESBdDkdA3s4A3s_1Y-m_26zcDI8e8-6dEEqoYx04LEWExavtkPbdqNXt_PmuZgrTFNrE1_skeUTqCvub7xleE072eCSUTlWRgEwBKCwPzo23h2zGEk';
const SEA_BASS_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAjxo7PTqnkb2ByquvTN4PSJF_aFOMai0e-66m_kY5OcMK4ScTwg9t57oCRYst1rzEc1Neh9Iga_77h8NhDXn967goGSOUgpMHysAY2CIrRlRJ3U6e1itvOO5qradubZrmmoH9PUKg-z1gvg7UrufKkcT9zCRHLBegT0IB6itGigaCDbCHmaqBzpvqf6up6BUoExydS2eQJt_XytyC1J_x5w_EPJit9xmrrqWS2zQa0ONiQUD9kIS7kzrbIZinwkH3ap4F35onxV2Y';
const CHEF_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCERWltkKVtse3b_wW36xjpnZH9THUDFygROWcQspdLRJ5HTiu6Q4NBDuP8s0kk_E5oXJtloZBVvgdvk9BSW6eZHPM0JIm2MWQi0JMbTSKmUFPHN4RR69klsdUG0fJLlQmNJl_wd_GzrcIxSvK19U9fBER_3KQL7fA0zIGK-dHc3w62l7nXnZm1R38Mognk_2XXCPih-BC_JYziLjhqu3dAC5c7svqIrWt6KOHKHronMZSMIgEaSepyrh4D-yb3FfW83BWYd5-39AA';

const RAW_ITEMS = [
  { id: '1', name: 'Classic Lumière Burger', category: 'Burgers', price: 24.0, description: 'Wagyu beef patty, triple-cream brie, caramelized shallots, and black truffle aioli on a gilded brioche bun.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPnMW5dTzCZOu7a6PpSjOSlCybHhDHqPeFSGTMzcjnJUv6rBGE21VIhFyzDKEvu-NBMg05nyksq-Lwkw0ossPDtrDTkqTN04smGY-4x3sKpcRpyUE8PrsMcLbrCIjXOpp6V1RwY6ZU5pDEaXNjeWCcBIuvx7PnpR0JM49W-TRK9SoAU_ZaCO_ypjMtuDH3Xf74s8govIaiFKYwFqrhV7YZS2cjgTcc0kGc8goiHp9sWbD-vQoIgo8mIqtFmvkNZUdko_I4t2P0Qbc', rating: 4.9, reviews: 120, prepTime: 15, badge: 'Chef Special' },
  { id: '2', name: 'Artisanal Pepperoni Pizza', category: 'Pizza', price: 21.0, description: 'Double-fermented sourdough, spicy calabrese, hot honey, and house-made buffalo mozzarella.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkCy0cRdoW0XthbpMq-yFA-zzuU-bFP9jHg2NTv8sGh3EohO-9aYfK7Dl5-I96z6f5kVU08oYYUTuQ5DMNyTeMikuOiPCQhM8gwpUJlG_K-45ftQPkeaBpFchmd-L9eZiWkvUz6VnF4KaJunClruzOJfkpV1gQugcoan1L0cP-BUMK1NLAkC-kH78J4zOIx-RSoJhW2WfCO42O_-CCtqspXCaTOFiIrzdNbVTW7ZO-t5eMPzEMxowDQFvBi5mSgVoZDUadMLBWbuM', rating: 4.8, reviews: 340, prepTime: 12, badge: 'Popular' },
  { id: '3', name: 'Bourbon BBQ Smoke Burger', category: 'Burgers', price: 26.0, description: 'Double beef patty, maple-cured bacon, crispy tobacco onions, and house bourbon glaze.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB07yMQwR76dh5D0-v3MBWBnL3ssfCTKGyCeBFg6jCV6apKSWuJ7r4QgeWROPdFGBcTEzEMFHYZ5UuXxp7elteDC3l8djSmj-okvh33bDz6Z4pUr-ZyPp-WcmhBQc_VghB9iwogm47jb1eYg71auUezC4tyTwRaFVijmT_pdPMcEO8uGZ_j4CZFfLeo85Wn4F-zjBt4ReFBT5L5nYXZHX8Lt8gU48YRbDZcCZqRWkOJC1sSSSVhq4n3PdpMR7hDae52qOnReftxOEg', rating: 4.7, reviews: 85, prepTime: 18, badge: undefined },
  { id: '4', name: 'Spicy Buffalo Wings', category: 'Starters', price: 18.0, description: 'Sous-vide then double-fried wings tossed in aged cayenne sauce. Served with roquefort dip.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbNGfsC8gCsW8lFrJs3yS08HEqpI3QxOqmPTqDuXYiIArhpoLfT2JoIEFFqFD0PD5ANgfPbDlmuQwtg1CGoIy9uEkguffKTxkD00xaEnHp7BMIRKzxABKSsZgWTTQs-UzTYMdpp01BSBCMxUzKhq8lAKrBY6PtVxVp9Vg38jaFFY0VvlSSPvtBi8Dm2BNd2oFg92Swe-F2EIWpCL8LXByIRzzrxTHfJdHN9NvNJsf6gROQQrDf6pMibfjTWtMvwQLXAtTCz2CU9GA', rating: 4.6, reviews: 1100, prepTime: 10, badge: undefined },
  { id: '5', name: 'Sea Bass Tartare & Citrus', category: 'Starters', price: 34.0, description: 'Wild sea bass, edible gold leaf, micro-herbs, and ruby grapefruit reduction.', image: SEA_BASS_URL, rating: 4.9, reviews: 420, prepTime: 12, badge: 'Signature' },
  { id: '6', name: 'Truffle & Wild Mushroom Pasta', category: 'Pasta', price: 29.0, description: 'Handcrafted tagliatelle, black summer truffle, chanterelles, and 36-month Parmigiano Reggiano.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqIb_Uo23kTJpPcIMURUZmNrGyhHrLA_AkoSspLoXESUeC2-QgV1mYlBTlKppD6cilp8R3RB8mMxOlfndzPvfhL7xITN5VCYtU4icw39sQMq5p_re4-y6CvplHpd7U_bLH6AjvF_5pZvgdYCleJD2VLWxbX5KPeDhLZfgMDH3IkQEynd-x99MRLYQ26FI1narcNVF049Tj7tSmABL55PD8_mGdAhJKp7Bej6eAaI1hLCiWlXN50imkpkwNu1W9aTVnGekbswD9zQY', rating: 4.9, reviews: 510, prepTime: 15, badge: undefined, isVeg: true },
  { id: '7', name: 'Wagyu Ribeye Steak (300g)', category: 'Steaks', price: 65.0, description: 'A5 Japanese Wagyu steak, bone marrow butter, roasted garlic head, and smoked sea salt flakes.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8ahzV-qIr22Is_b8mUE8ZmFoYSg6UIiCOEuDGEcKRIjnUPd0mPnpt4ygBsi_JGlLMaQkItlCuNo6k36T1YYd4uaU1zoVRM3qrereIuSuADm5MQUgTpS600hMNOiLD9E6waygSgdOF2hRatW5Hh48IzFShpVgUp5ABu79zo68vOQWKv1Wy949N0PUp9CAsUJg9hiAPXAjWLbS1vB6pUebHkwNWFh_Y0BJP4kaMxcSGr1xeu1AsmF41ttCSrPao62HFMy6ihibr3Vg', rating: 5.0, reviews: 290, prepTime: 20, badge: 'Luxury' },
  { id: '8', name: 'Deconstructed Chocolate Sphere', category: 'Desserts', price: 28.0, description: 'Valrhona 70% dark chocolate, gold leaf finish, warm hazelnut praline pour over vanilla bean gelato.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqIb_Uo23kTJpPcIMURUZmNrGyhHrLA_AkoSspLoXESUeC2-QgV1mYlBTlKppD6cilp8R3RB8mMxOlfndzPvfhL7xITN5VCYtU4icw39sQMq5p_re4-y6CvplHpd7U_bLH6AjvF_5pZvgdYCleJD2VLWxbX5KPeDhLZfgMDH3IkQEynd-x99MRLYQ26FI1narcNVF049Tj7tSmABL55PD8_mGdAhJKp7Bej6eAaI1hLCiWlXN50imkpkwNu1W9aTVnGekbswD9zQY', rating: 4.9, reviews: 640, prepTime: 10, badge: 'Popular', isVeg: true },
  { id: '9', name: 'Château Margaux 2015 Premier Cru', category: 'Beverages', price: 185.0, description: 'Sommelier selected premier grand cru classé, decanted and temperature-controlled.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ2SwfE-L4ENpw0vIUBXHTsJ5WtR_WchM-HleBOHJAKcVE2EBoTYxscGxwzwDphMvAL9Pm3bTQC8jItpGg-PcEX1N9MSqhU2utK5AyJayd_q0O_cOC9f6IAl0iRpUqomC_fV9pMHcOmnPnX0Sou3nleMjzMJkmyjHFb6knQH015fgsy3GnbPME85GyiNwRQCGkXjkwlICjSCGB3pd2zxXB7PMtsokmlyiVv3KycxRD8J9mx0S1RZFZd-YIMe1fwVXt9dw_1vBgTKw', rating: 5.0, reviews: 180, prepTime: 5, badge: undefined },
];

const RAW_ADDONS = [
  { id: 'addon-sparkling-water', name: 'San Pellegrino (750ml)', price: 6.0, description: 'Chilled sparkling mineral water', isVeg: true, group: 'Beverages', groupSelection: 'multiple' as const },
  { id: 'addon-house-lemonade', name: 'Yuzu House Lemonade', price: 8.0, description: 'Fresh yuzu, mint, and sparkling soda', isVeg: true, group: 'Beverages', groupSelection: 'multiple' as const },
  { id: 'addon-espresso-martini', name: 'Espresso Martini', price: 16.0, description: 'Vodka, coffee liqueur, fresh espresso', group: 'Beverages', groupSelection: 'multiple' as const },
  { id: 'addon-champagne-flute', name: 'Champagne Flute', price: 22.0, description: 'Glass of house champagne', isVeg: true, group: 'Beverages', groupSelection: 'multiple' as const },
  { id: 'addon-truffle-fries', name: 'Truffle Parmesan Fries', price: 9.0, description: 'Hand-cut fries, shaved truffle, aged parmesan', isVeg: true, group: 'Add-on Items', groupSelection: 'multiple' as const },
  { id: 'addon-foie-gras', name: 'Seared Foie Gras', price: 28.0, description: 'Pan-seared with cherry gastrique', group: 'Add-on Items', groupSelection: 'multiple' as const },
  { id: 'addon-extra-wagyu', name: 'Extra Wagyu Patty', price: 14.0, description: 'Additional A5 wagyu beef patty', group: 'Add-on Items', groupSelection: 'multiple' as const },
  { id: 'addon-gold-leaf', name: 'Edible Gold Leaf Finish', price: 12.0, description: 'Chef signature gold leaf garnish', isVeg: true, group: 'Add-on Items', groupSelection: 'multiple' as const },
  { id: 'addon-side-salad', name: 'Heritage Leaf Salad', price: 8.0, description: 'Seasonal greens, citrus vinaigrette', isVeg: true, group: 'Add-on Items', groupSelection: 'multiple' as const },
  { id: 'addon-combo-soup', name: 'Amuse-Bouche Soup Shot', price: 7.0, description: 'Seasonal bisque tasting pour', isVeg: true, group: 'In Combination With', groupSelection: 'single' as const },
  { id: 'addon-combo-dessert', name: 'Petit Four Duo', price: 11.0, description: 'Two chef choice bite-sized desserts', isVeg: true, group: 'In Combination With', groupSelection: 'single' as const },
  { id: 'addon-combo-cheese', name: 'Artisan Cheese Nibble', price: 13.0, description: 'Selection of three aged cheeses', isVeg: true, group: 'In Combination With', groupSelection: 'single' as const },
];

const CATEGORY_NAMES = ['Burgers', 'Pizza', 'Starters', 'Pasta', 'Steaks', 'Desserts', 'Beverages'];

export interface StarterSectionCopy {
  heroHeading: string;
  heroDescription: string;
  aboutEyebrow: string;
  aboutHeading: string;
  aboutDescription: string;
  featuredHeading: string;
  galleryHeading: string;
  offersHeading: string;
  testimonialsHeading: string;
  testimonials: Array<[string, string]>;
}

/**
 * Every Site gets all 7 homepage section types so each is editable from Website → Homepage (the section
 * update endpoint 404s on a type the draft doesn't have). Sections with no data yet - featured items,
 * gallery, offers - start hidden so nothing empty shows on the public page until the owner fills them in.
 */
export function buildStarterSections(siteId: string, now: string, hero: HomepageSection | null, copy: StarterSectionCopy): HomepageSection[] {
  const base = { restaurantId: siteId, updatedAt: now, templateVariant: 'a' as const };
  return [
    hero ?? {
      ...base, id: `section_${siteId}_hero`, type: 'hero', order: 1, visible: true,
      content: { heading: copy.heroHeading, description: copy.heroDescription, buttonText: 'Reserve a Table', buttonLink: '/reservations', secondaryButtonText: 'View Menu', secondaryButtonLink: '/menu', backgroundMediaId: null, overlayOpacity: 50 },
    },
    { ...base, id: `section_${siteId}_about`, type: 'about', order: 2, visible: true, content: { eyebrow: copy.aboutEyebrow, heading: copy.aboutHeading, description: copy.aboutDescription, imageMediaId: null } },
    { ...base, id: `section_${siteId}_featured_menu`, type: 'featured_menu', order: 3, visible: false, content: { heading: copy.featuredHeading, selectedItemIds: [] } },
    { ...base, id: `section_${siteId}_gallery`, type: 'gallery', order: 4, visible: false, content: { heading: copy.galleryHeading, images: [] } },
    { ...base, id: `section_${siteId}_offers`, type: 'offers', order: 5, visible: false, content: { heading: copy.offersHeading, selectedOfferIds: [] } },
    {
      ...base, id: `section_${siteId}_testimonials`, type: 'testimonials', order: 6, visible: copy.testimonials.length > 0,
      content: {
        heading: copy.testimonialsHeading,
        testimonials: copy.testimonials.map(([customerName, quote], order) => ({ id: `testimonial_${siteId}_${order}`, customerName, quote, rating: 5, order })),
      },
    },
    { ...base, id: `section_${siteId}_location`, type: 'location', order: 7, visible: true, content: { heading: 'Find Us', showHoursTable: true } },
  ];
}

export function buildSeed(): MockDbShape {
  const now = nowIso();

  const restaurant: Restaurant = {
    id: RESTAURANT_ID,
    organizationId: ORGANIZATION_ID,
    slug: RESTAURANT_SLUG,
    name: 'Lumière',
    ownerUserId: 'user_owner',
    status: 'active',
    vertical: 'restaurant',
    brandingBadgeEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  const secondSite: Restaurant = {
    id: SECOND_SITE_ID,
    organizationId: ORGANIZATION_ID,
    slug: SECOND_SITE_SLUG,
    name: 'Lumière – Notting Hill',
    ownerUserId: 'user_owner',
    status: 'active',
    vertical: 'restaurant',
    brandingBadgeEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  const organizations: Organization[] = [
    { id: ORGANIZATION_ID, code: ORGANIZATION_CODE, name: 'Lumière', createdAt: now, updatedAt: now },
  ];

  const users: User[] = [
    { id: 'user_super', organizationId: ORGANIZATION_ID, email: 'admin@platform.com', name: 'Platform Admin', role: 'super_admin', restaurantId: null, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_owner', organizationId: ORGANIZATION_ID, email: 'owner@lumiere.com', name: 'Ava Whitfield', role: 'owner', restaurantId: RESTAURANT_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_staff', organizationId: ORGANIZATION_ID, email: 'staff@lumiere.com', name: 'Jordan Reyes', role: 'staff', restaurantId: RESTAURANT_ID, siteAccess: [RESTAURANT_ID], isActive: true, createdAt: now, updatedAt: now },
  ];

  const media: MediaAsset[] = [
    { id: 'media_hero_bg', restaurantId: RESTAURANT_ID, fileUrl: HERO_BG_URL, fileType: 'image', mimeType: 'image/jpeg', fileName: 'hero-background.jpg', fileSizeBytes: 0, altText: 'Lumière dining room at golden hour', folder: 'images', createdAt: now, updatedAt: now },
    { id: 'media_about', restaurantId: RESTAURANT_ID, fileUrl: SEA_BASS_URL, fileType: 'image', mimeType: 'image/jpeg', fileName: 'sea-bass-tartare.jpg', fileSizeBytes: 0, altText: 'Sea Bass Tartare with Citrus Gel', folder: 'images', createdAt: now, updatedAt: now },
    { id: 'media_chef', restaurantId: RESTAURANT_ID, fileUrl: CHEF_URL, fileType: 'image', mimeType: 'image/jpeg', fileName: 'chef-marcelle-vignon.jpg', fileSizeBytes: 0, altText: 'Chef Marcelle Vignon', folder: 'images', createdAt: now, updatedAt: now },
    ...GALLERY_SEED.map((g) => ({
      id: g.id,
      restaurantId: RESTAURANT_ID,
      fileUrl: g.src,
      fileType: 'image' as const,
      mimeType: 'image/jpeg',
      fileName: `${g.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      fileSizeBytes: 0,
      altText: g.title,
      folder: 'images' as const,
      createdAt: now,
      updatedAt: now,
    })),
  ];

  const categories: MenuCategory[] = CATEGORY_NAMES.map((name, idx) => ({
    id: `cat_${name.toLowerCase()}`,
    restaurantId: RESTAURANT_ID,
    name,
    displayOrder: idx,
    isVisible: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const addonAssignments: Record<string, string[]> = {
    '1': ['addon-truffle-fries', 'addon-extra-wagyu', 'addon-gold-leaf'],
    '2': ['addon-truffle-fries'],
    '7': ['addon-foie-gras', 'addon-gold-leaf'],
  };

  const items: MenuItem[] = RAW_ITEMS.map((raw, idx) => ({
    id: raw.id,
    restaurantId: RESTAURANT_ID,
    categoryId: `cat_${raw.category.toLowerCase()}`,
    name: raw.name,
    description: raw.description,
    price: raw.price,
    imageMediaId: null,
    imageUrl: raw.image,
    foodType: raw.category === 'Beverages' ? 'na' : raw.isVeg ? 'veg' : 'non_veg',
    tags: raw.badge ? [raw.badge] : [],
    prepTimeMinutes: raw.prepTime,
    rating: raw.rating,
    reviewCount: raw.reviews,
    isAvailable: true,
    isFeatured: Boolean(raw.badge),
    displayOrder: idx,
    variants: [],
    addonIds: addonAssignments[raw.id] ?? [],
    activeOfferId: raw.id === '1' ? 'offer_burger_special' : null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const addons: Addon[] = RAW_ADDONS.map((raw) => ({
    id: raw.id,
    restaurantId: RESTAURANT_ID,
    name: raw.name,
    price: raw.price,
    description: raw.description,
    isVeg: raw.isVeg,
    isAvailable: true,
    group: raw.group,
    groupSelection: raw.groupSelection,
    createdAt: now,
    updatedAt: now,
  }));

  const offers: Offer[] = [
    {
      id: 'offer_burger_special',
      restaurantId: RESTAURANT_ID,
      name: 'Weekday Burger Special',
      type: 'percentage',
      discountValue: 20,
      startDate: now,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
      isActive: true,
      appliesToItemIds: ['1'],
      appliesToCategoryIds: [],
      cta: 'Order Now',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

  const buildOrderItem = (item: MenuItem, quantity: number, addonList: Addon[] = []): OrderLineItem => {
    const addonsTotal = addonList.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = item.price + addonsTotal;
    return {
      itemId: item.id,
      name: item.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      addons: addonList.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    };
  };

  const buildOrder = (opts: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    service: OrderServiceType;
    paymentMethod?: OrderPaymentMethod;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    address?: string;
    items: OrderLineItem[];
    placedMinutesAgo: number;
    statusUpdatedMinutesAgo?: number;
  }): Order => {
    const subtotal = opts.items.reduce((sum, i) => sum + i.lineTotal, 0);
    const taxes = Math.round(subtotal * 0.085 * 100) / 100;
    const deliveryFee = opts.service === 'delivery' ? 15 : 0;
    const total = subtotal + taxes + deliveryFee;
    const placedAt = minutesAgo(opts.placedMinutesAgo);
    const statusUpdatedAt = minutesAgo(opts.statusUpdatedMinutesAgo ?? opts.placedMinutesAgo);
    return {
      id: opts.id,
      restaurantId: RESTAURANT_ID,
      orderNumber: opts.orderNumber,
      status: opts.status,
      service: opts.service,
      paymentMethod: opts.paymentMethod ?? 'card',
      customerName: opts.customerName,
      customerPhone: opts.customerPhone,
      customerEmail: opts.customerEmail,
      address: opts.address,
      items: opts.items,
      subtotal,
      taxes,
      deliveryFee,
      total,
      placedAt,
      statusUpdatedAt,
      createdAt: placedAt,
      updatedAt: statusUpdatedAt,
    };
  };

  const orders: Order[] =
    items.length >= 4
      ? [
          buildOrder({
            id: 'order_1', orderNumber: '1042', status: 'paid', service: 'pickup',
            customerName: 'Sarah Chen', customerPhone: '+44 7700 900001', customerEmail: 'sarah.chen@example.com',
            items: [buildOrderItem(items[0], 2), buildOrderItem(items[2], 1)],
            placedMinutesAgo: 3,
          }),
          buildOrder({
            id: 'order_2', orderNumber: '1041', status: 'confirmed', service: 'delivery',
            customerName: 'Marcus Reid', customerPhone: '+44 7700 900002', customerEmail: 'marcus.reid@example.com',
            address: '22 Berkeley Square, Mayfair, London',
            items: [buildOrderItem(items[1], 1, addons.slice(0, 1))],
            placedMinutesAgo: 9, statusUpdatedMinutesAgo: 6,
          }),
          buildOrder({
            id: 'order_3', orderNumber: '1040', status: 'preparing', service: 'pickup',
            customerName: 'Aiko Tanaka', customerPhone: '+44 7700 900003', customerEmail: 'aiko.t@example.com',
            items: [buildOrderItem(items[3], 1), buildOrderItem(items[0], 1)],
            placedMinutesAgo: 18, statusUpdatedMinutesAgo: 10,
          }),
          buildOrder({
            id: 'order_4', orderNumber: '1039', status: 'preparing', service: 'delivery',
            customerName: 'Oliver Bennett', customerPhone: '+44 7700 900004', customerEmail: 'oliver.b@example.com',
            address: '5 Curzon Street, Mayfair, London',
            items: [buildOrderItem(items[2], 2)],
            placedMinutesAgo: 24, statusUpdatedMinutesAgo: 20,
          }),
          buildOrder({
            id: 'order_5', orderNumber: '1038', status: 'ready', service: 'pickup',
            customerName: 'Priya Anand', customerPhone: '+44 7700 900005', customerEmail: 'priya.a@example.com',
            items: [buildOrderItem(items[1], 1)],
            placedMinutesAgo: 16, statusUpdatedMinutesAgo: 4,
          }),
          buildOrder({
            id: 'order_6', orderNumber: '1037', status: 'completed', service: 'pickup',
            customerName: 'James Whitmore', customerPhone: '+44 7700 900006', customerEmail: 'james.w@example.com',
            items: [buildOrderItem(items[0], 3)],
            placedMinutesAgo: 65, statusUpdatedMinutesAgo: 40,
          }),
          buildOrder({
            id: 'order_7', orderNumber: '1036', status: 'cancelled', service: 'delivery',
            customerName: 'Eleanor Cross', customerPhone: '+44 7700 900007', customerEmail: 'eleanor.c@example.com',
            address: '10 Grosvenor Square, Mayfair, London',
            items: [buildOrderItem(items[3], 1)],
            placedMinutesAgo: 90, statusUpdatedMinutesAgo: 85,
          }),
        ]
      : [];

  const buildReservation = (opts: {
    id: string;
    confirmationCode: string;
    status: ReservationStatus;
    date: string;
    timeSlot: string;
    partySize: number;
    seatingPreference: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
    newsletterOptIn?: boolean;
    placedMinutesAgo: number;
  }): Reservation => {
    const placedAt = minutesAgo(opts.placedMinutesAgo);
    return {
      id: opts.id,
      restaurantId: RESTAURANT_ID,
      confirmationCode: opts.confirmationCode,
      status: opts.status,
      date: opts.date,
      timeSlot: opts.timeSlot,
      partySize: opts.partySize,
      seatingPreference: opts.seatingPreference,
      guestName: opts.guestName,
      guestEmail: opts.guestEmail,
      guestPhone: opts.guestPhone,
      specialRequests: opts.specialRequests,
      newsletterOptIn: opts.newsletterOptIn ?? false,
      placedAt,
      createdAt: placedAt,
      updatedAt: placedAt,
    };
  };

  const isoDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    return d.toISOString().slice(0, 10);
  };

  const reservations: Reservation[] = [
    buildReservation({
      id: 'reservation_1', confirmationCode: 'LUM-82910', status: 'confirmed',
      date: isoDate(2), timeSlot: '19:00', partySize: 2, seatingPreference: 'Window',
      guestName: 'Sarah Chen', guestEmail: 'sarah.chen@example.com', guestPhone: '+44 7700 900001',
      newsletterOptIn: true, placedMinutesAgo: 40,
    }),
    buildReservation({
      id: 'reservation_2', confirmationCode: 'LUM-82911', status: 'confirmed',
      date: isoDate(0), timeSlot: '20:15', partySize: 4, seatingPreference: 'Booth',
      guestName: 'Marcus Reid', guestEmail: 'marcus.reid@example.com', guestPhone: '+44 7700 900002',
      specialRequests: 'Anniversary dinner, quiet table if possible.', placedMinutesAgo: 120,
    }),
    buildReservation({
      id: 'reservation_3', confirmationCode: 'LUM-82912', status: 'seated',
      date: isoDate(0), timeSlot: '13:30', partySize: 2, seatingPreference: 'Bar',
      guestName: 'Aiko Tanaka', guestEmail: 'aiko.t@example.com', guestPhone: '+44 7700 900003',
      placedMinutesAgo: 90,
    }),
    buildReservation({
      id: 'reservation_4', confirmationCode: 'LUM-82913', status: 'completed',
      date: isoDate(-1), timeSlot: '18:30', partySize: 6, seatingPreference: 'Large Group (8+)',
      guestName: 'Oliver Bennett', guestEmail: 'oliver.b@example.com', guestPhone: '+44 7700 900004',
      placedMinutesAgo: 1600,
    }),
    buildReservation({
      id: 'reservation_5', confirmationCode: 'LUM-82914', status: 'cancelled',
      date: isoDate(-2), timeSlot: '21:00', partySize: 2, seatingPreference: 'Window',
      guestName: 'Priya Anand', guestEmail: 'priya.a@example.com', guestPhone: '+44 7700 900005',
      placedMinutesAgo: 2900,
    }),
    buildReservation({
      id: 'reservation_6', confirmationCode: 'LUM-82915', status: 'no_show',
      date: isoDate(-3), timeSlot: '19:45', partySize: 3, seatingPreference: 'Booth',
      guestName: 'James Whitmore', guestEmail: 'james.w@example.com', guestPhone: '+44 7700 900006',
      placedMinutesAgo: 4200,
    }),
    buildReservation({
      id: 'reservation_7', confirmationCode: 'LUM-82916', status: 'confirmed',
      date: isoDate(5), timeSlot: '12:00', partySize: 2, seatingPreference: 'Window',
      guestName: 'Eleanor Cross', guestEmail: 'eleanor.c@example.com', guestPhone: '+44 7700 900007',
      placedMinutesAgo: 30,
    }),
  ];

  const AFTERNOON_TIMES = ['12:00', '13:30', '14:45', '15:30'];
  const EVENING_TIMES = ['18:30', '19:00', '20:15', '21:00', '21:45', '22:30'];
  const WEEK_DAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const reservationAvailabilitySettings: ReservationAvailabilitySettings = {
    restaurantId: RESTAURANT_ID,
    days: WEEK_DAYS.map((day) => ({
      day,
      isClosed: false,
      openTime: '12:00',
      closeTime: '23:00',
      slotDurationMins: 90,
      maxPerSlot: 4,
      slots: [...AFTERNOON_TIMES, ...EVENING_TIMES].map((time) => ({ time, isOpen: true })),
    })),
    blockedDates: [],
  };

  /** Plan §6/§12 - default nav label + variant per module for a freshly seeded Site; membership defaults off for a freshly created Site until its owner turns it on. */
  function buildDefaultPageConfigs(siteId: string, membershipEnabled = false): PageConfig[] {
    const defaults: Array<{ module: PlatformModule; navLabel: string; enabled: boolean }> = [
      { module: 'items', navLabel: 'Menu', enabled: true },
      { module: 'catalog', navLabel: 'Online Order', enabled: true },
      { module: 'booking', navLabel: 'Reservations', enabled: true },
      { module: 'membership', navLabel: 'Membership', enabled: membershipEnabled },
    ];
    return defaults.map((d, order) => ({
      id: `pageconfig_${siteId}_${d.module}`,
      restaurantId: siteId,
      module: d.module,
      enabled: d.enabled,
      navLabel: d.navLabel,
      order,
      templateVariant: 'a' as const,
      createdAt: now,
      updatedAt: now,
    }));
  }

  /** Plan §9/§12 - every Site gets one always-present, non-removable platform_subdomain row, already verified/issued (no DNS to wait on for a subdomain we control). */
  function buildDefaultDomainMappings(siteId: string, slug: string): DomainMapping[] {
    return [
      {
        id: `domain_${siteId}_platform`,
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
      },
    ];
  }

  /** Plan §6 step 3 - a brand-new demo Org/Site takes its module defaults straight from the same table the onboarding wizard uses (Phase 6). */
  function buildPageConfigsForVertical(siteId: string, vertical: Vertical): PageConfig[] {
    return VERTICAL_MODULE_DEFAULTS[vertical].map((d, order) => ({
      id: `pageconfig_${siteId}_${d.module}`,
      restaurantId: siteId,
      module: d.module,
      enabled: d.enabled,
      navLabel: d.navLabel,
      order,
      templateVariant: defaultTemplateVariant(vertical, d.module),
      createdAt: now,
      updatedAt: now,
    }));
  }

  /** Plan §3.2/§8.4 - a few demo Plans + Members for the Lumière Site, whose Membership module ships enabled out of the box. */
  const membershipPlans: MembershipPlan[] = [
    {
      id: 'plan_gold',
      restaurantId: RESTAURANT_ID,
      name: 'Gold Table Club',
      description: 'Priority reservations, a complimentary aperitif, and a dedicated concierge line.',
      priceCents: 4900,
      billingInterval: 'monthly',
      benefits: ['Priority reservations', 'Complimentary aperitif each visit', 'Dedicated concierge line'],
      isActive: true,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'plan_annual',
      restaurantId: RESTAURANT_ID,
      name: 'Annual Connoisseur',
      description: "A full year of Lumière's chef's table experiences, billed once.",
      priceCents: 45000,
      billingInterval: 'yearly',
      benefits: ["Two chef's table seatings per quarter", '10% off private dining', 'Birthday month bottle of house Champagne'],
      isActive: true,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'plan_taster',
      restaurantId: RESTAURANT_ID,
      name: 'Taster Pass',
      description: 'A single-visit introduction to the Lumière tasting menu at a members-only rate.',
      priceCents: 1500,
      billingInterval: 'one_time',
      benefits: ['One-time tasting menu discount'],
      isActive: false,
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  function nextBillingDateFor(interval: MembershipBillingInterval, from: Date): string | null {
    if (interval === 'one_time') return null;
    const d = new Date(from);
    if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
    if (interval === 'quarterly') d.setMonth(d.getMonth() + 3);
    if (interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }

  const daysAgoDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const members: Member[] = [
    {
      id: 'member_1',
      restaurantId: RESTAURANT_ID,
      planId: 'plan_gold',
      customerName: 'Eleanor Cross',
      customerEmail: 'eleanor.c@example.com',
      customerPhone: '+44 7700 900007',
      status: 'active',
      startDate: daysAgoDate(40),
      nextBillingDate: nextBillingDateFor('monthly', new Date()),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'member_2',
      restaurantId: RESTAURANT_ID,
      planId: 'plan_annual',
      customerName: 'James Whitmore',
      customerEmail: 'james.w@example.com',
      customerPhone: '+44 7700 900006',
      status: 'active',
      startDate: daysAgoDate(120),
      nextBillingDate: nextBillingDateFor('yearly', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'member_3',
      restaurantId: RESTAURANT_ID,
      planId: 'plan_gold',
      customerName: 'Priya Anand',
      customerEmail: 'priya.a@example.com',
      customerPhone: '+44 7700 900005',
      status: 'paused',
      startDate: daysAgoDate(200),
      nextBillingDate: null,
      notes: 'Paused while traveling - resumes next month.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const memberCheckIns: MemberCheckIn[] = [
    { id: 'checkin_1', restaurantId: RESTAURANT_ID, memberId: 'member_1', checkedInAt: minutesAgo(120) },
    { id: 'checkin_2', restaurantId: RESTAURANT_ID, memberId: 'member_1', checkedInAt: minutesAgo(60 * 24 * 12) },
    { id: 'checkin_3', restaurantId: RESTAURANT_ID, memberId: 'member_2', checkedInAt: minutesAgo(60 * 24 * 5) },
  ];

  const brandSettings: BrandSettings = {
    restaurantId: RESTAURANT_ID,
    restaurantName: 'Lumière',
    tagline: 'Modern French, Mayfair',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'dusty-gold',
    primaryFont: 'Geist',
    headingFont: 'Cormorant Garamond',
    fontWeight: 'regular',
    buttonStyle: 'rounded',
    borderRadius: 'lg',
    navPosition: 'right',
    socialLinks: { instagram: '', facebook: '', whatsapp: '' },
    contact: {
      phone: '+44 (0) 20 7123 4567',
      email: 'hello@lumiere-dining.com',
      address: '12 Berkeley Square, Mayfair, London',
    },
    description:
      'Experience the invisible excellence of modern French cuisine in the heart of Mayfair. Part of the Haute-Cuisine Group.',
    cuisineType: 'Modern French',
    businessHours: [
      { day: 'mon', isClosed: false, openTime: '18:00', closeTime: '23:00' },
      { day: 'tue', isClosed: false, openTime: '18:00', closeTime: '23:00' },
      { day: 'wed', isClosed: false, openTime: '18:00', closeTime: '23:00' },
      { day: 'thu', isClosed: false, openTime: '18:00', closeTime: '23:00' },
      { day: 'fri', isClosed: false, openTime: '12:00', closeTime: '00:00' },
      { day: 'sat', isClosed: false, openTime: '12:00', closeTime: '00:00' },
      { day: 'sun', isClosed: false, openTime: '12:00', closeTime: '21:00' },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const homepageSections: HomepageSection[] = [
    {
      id: 'section_hero', restaurantId: RESTAURANT_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'Mayfair, London',
        heading: 'Lumière',
        description: 'Experience invisible excellence at our flagship dining room in Mayfair.',
        buttonText: 'Reserve a Table',
        buttonLink: '/reservations',
        secondaryButtonText: 'View Menu',
        secondaryButtonLink: '/menu',
        backgroundMediaId: 'media_hero_bg',
        overlayOpacity: 50,
      },
    },
    {
      id: 'section_about', restaurantId: RESTAURANT_ID, type: 'about', order: 2, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'The Philosophy',
        heading: 'A sanctuary of light and culinary precision.',
        description:
          'At Lumière, we believe the finest dining experiences are those where the service is felt but not seen. Every dish is a dialogue between tradition and innovation, meticulously crafted to showcase the purest essence of seasonal ingredients.',
        imageMediaId: 'media_about',
        quote: 'The intersection of high-end hospitality and technical precision.',
        chefName: 'Chef Marcelle Vignon',
        chefQuote:
          'Culinary art is not found in complexity, but in the radical simplification of a flavor until its soul is revealed. At Lumière, we strip away the noise to let the ingredient speak.',
        chefBio:
          'With three Michelin stars and a career spanning the finest kitchens of Lyon and Paris, Chef Vignon brings a technical rigor to Mayfair that is unmatched. Her vision for Lumière was to create a space where diners could lose track of time, anchored only by the rhythm of the season.',
        chefImageMediaId: 'media_chef',
      },
    },
    {
      id: 'section_featured_menu', restaurantId: RESTAURANT_ID, type: 'featured_menu', order: 3, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'Chef Selection',
        heading: 'Featured Dishes',
        description: 'A curated selection from our kitchen, chosen by Chef Vignon.',
        selectedItemIds: ['1', '2', '5', '7'],
      },
    },
    {
      id: 'section_gallery', restaurantId: RESTAURANT_ID, type: 'gallery', order: 4, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'Visual Atmosphere',
        heading: 'The Lumière Gallery',
        description: 'Captured moments of invisible excellence',
        images: GALLERY_SEED.map((g, idx) => ({ mediaId: g.id, caption: g.caption, order: idx })),
      },
    },
    {
      id: 'section_offers', restaurantId: RESTAURANT_ID, type: 'offers', order: 5, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'Limited Time',
        heading: 'Special Offers',
        description: 'Seasonal promotions from the kitchen and cellar.',
        selectedOfferIds: ['offer_burger_special'],
      },
    },
    {
      id: 'section_testimonials', restaurantId: RESTAURANT_ID, type: 'testimonials', order: 6, visible: true, templateVariant: 'a', updatedAt: now,
      content: {
        eyebrow: 'Guest Experiences',
        heading: 'What Our Guests Say',
        testimonials: [
          { id: 'testimonial_1', customerName: 'Eleanor Cross', quote: 'The most refined dining experience in Mayfair - every detail considered.', rating: 5, order: 0 },
          { id: 'testimonial_2', customerName: 'James Whitmore', quote: 'Chef Vignon’s tasting menu is a masterclass in restraint and flavor.', rating: 5, order: 1 },
          { id: 'testimonial_3', customerName: 'Priya Anand', quote: 'Impeccable service and a wine list to match. Our go-to for anniversaries.', rating: 4, order: 2 },
        ],
      },
    },
    {
      id: 'section_location', restaurantId: RESTAURANT_ID, type: 'location', order: 7, visible: true, templateVariant: 'a', updatedAt: now,
      content: { heading: 'Find Us', showHoursTable: true },
    },
  ];

  const homepagePublished: Homepage = { restaurantId: RESTAURANT_ID, status: 'published', sections: homepageSections };
  const homepageDraft: Homepage = { restaurantId: RESTAURANT_ID, status: 'draft', sections: homepageSections.map((s) => ({ ...s })) };

  const secondSiteBrand: BrandSettings = {
    ...brandSettings,
    restaurantId: SECOND_SITE_ID,
    restaurantName: 'Lumière – Notting Hill',
    tagline: 'Modern French, Notting Hill',
  };

  const secondSiteHomepage: Homepage = {
    restaurantId: SECOND_SITE_ID,
    status: 'published',
    sections: buildStarterSections(SECOND_SITE_ID, now, null, {
      heroHeading: 'Lumière – Notting Hill',
      heroDescription: 'Modern French dining, now in Notting Hill.',
      aboutEyebrow: 'Our Story',
      aboutHeading: 'The Lumière table, in West London.',
      aboutDescription: 'The same seasonal cooking and quiet hospitality as our Mayfair flagship, in a relaxed neighbourhood dining room.',
      featuredHeading: 'Featured Dishes',
      galleryHeading: 'Gallery',
      offersHeading: 'Special Offers',
      testimonialsHeading: 'What Our Guests Say',
      testimonials: [['Hannah Lee', 'A neighbourhood gem with flagship-level cooking.'], ['Tom Ashby', 'Warm service and a beautiful tasting menu.']],
    }),
  };

  // --- Gym demo tenant (own Org/login) - Plan §2/§6, a second Vertical alongside Lumière's Restaurant. ---
  const gymOrganization: Organization = { id: GYM_ORGANIZATION_ID, code: GYM_ORGANIZATION_CODE, name: 'PulseFit Studios', createdAt: now, updatedAt: now };
  const gymOwner: User = {
    id: 'user_pulsefit_owner', organizationId: GYM_ORGANIZATION_ID, email: 'owner@pulsefit.com', name: 'Marcus Bell',
    role: 'owner', restaurantId: GYM_SITE_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now,
  };
  const gymSite: Restaurant = {
    id: GYM_SITE_ID, organizationId: GYM_ORGANIZATION_ID, slug: GYM_SITE_SLUG, name: 'PulseFit Studios',
    ownerUserId: gymOwner.id, status: 'active', vertical: 'gym', brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  };
  const gymBrand: BrandSettings = {
    restaurantId: GYM_SITE_ID,
    restaurantName: 'PulseFit Studios',
    tagline: 'Train harder, together.',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'emerald',
    primaryFont: 'Inter',
    headingFont: 'Poppins',
    fontWeight: 'semibold',
    buttonStyle: 'pill',
    borderRadius: 'full',
    navPosition: 'right',
    socialLinks: { instagram: '', facebook: '' },
    contact: { phone: '+1 (312) 555-0142', email: 'hello@pulsefitstudios.com', address: '480 Wells Street, Chicago, IL' },
    description: 'PulseFit Studios is a community-driven strength & conditioning gym - small-group programming, real coaching, no ego.',
    cuisineType: '',
    businessHours: [
      { day: 'mon', isClosed: false, openTime: '06:00', closeTime: '22:00' },
      { day: 'tue', isClosed: false, openTime: '06:00', closeTime: '22:00' },
      { day: 'wed', isClosed: false, openTime: '06:00', closeTime: '22:00' },
      { day: 'thu', isClosed: false, openTime: '06:00', closeTime: '22:00' },
      { day: 'fri', isClosed: false, openTime: '06:00', closeTime: '21:00' },
      { day: 'sat', isClosed: false, openTime: '08:00', closeTime: '18:00' },
      { day: 'sun', isClosed: false, openTime: '08:00', closeTime: '16:00' },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const gymHeroSection: HomepageSection = {
    id: 'section_pulsefit_hero', restaurantId: GYM_SITE_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
    content: {
      eyebrow: 'Chicago, IL',
      heading: 'PulseFit Studios',
      description: 'Small-group strength & conditioning - real coaching, real community.',
      buttonText: 'Book a Class',
      buttonLink: '#/reservations',
      secondaryButtonText: 'View Programs',
      secondaryButtonLink: '#/items',
      backgroundMediaId: null,
      overlayOpacity: 45,
    },
  };
  const gymSeed = buildGymSeed(GYM_SITE_ID, now, gymHeroSection);
  const gymHomepage: Homepage = { restaurantId: GYM_SITE_ID, status: 'published', sections: gymSeed.sections };
  const gymMembershipPlans: MembershipPlan[] = [
    { id: 'plan_pulsefit_monthly', restaurantId: GYM_SITE_ID, name: 'Monthly Unlimited', description: 'Unlimited classes, every month.', priceCents: 8900, billingInterval: 'monthly', benefits: ['Unlimited classes', 'Guest passes (2/mo)', 'App booking'], isActive: true, order: 0, createdAt: now, updatedAt: now },
    { id: 'plan_pulsefit_annual', restaurantId: GYM_SITE_ID, name: 'Annual', description: 'Best value - one payment, all year.', priceCents: 85000, billingInterval: 'yearly', benefits: ['Everything in Monthly', '2 months free', 'Priority booking'], isActive: true, order: 1, createdAt: now, updatedAt: now },
    { id: 'plan_pulsefit_classpack', restaurantId: GYM_SITE_ID, name: '10-Class Pack', description: 'Pay as you train.', priceCents: 15000, billingInterval: 'one_time', benefits: ['10 class credits', 'No expiry'], isActive: true, order: 2, createdAt: now, updatedAt: now },
  ];
  const gymAvailability: ReservationAvailabilitySettings = {
    restaurantId: GYM_SITE_ID,
    days: WEEK_DAYS.map((day) => ({ day, isClosed: false, openTime: '06:00', closeTime: '21:00', slotDurationMins: 60, maxPerSlot: 12, slots: [] })),
    blockedDates: [],
  };

  // --- Retail demo tenant (own Org/login) - Plan §2/§6, the third Vertical. ---
  const retailOrganization: Organization = { id: RETAIL_ORGANIZATION_ID, code: RETAIL_ORGANIZATION_CODE, name: 'Nova Goods', createdAt: now, updatedAt: now };
  const retailOwner: User = {
    id: 'user_novagoods_owner', organizationId: RETAIL_ORGANIZATION_ID, email: 'owner@novagoods.com', name: 'Priya Nair',
    role: 'owner', restaurantId: RETAIL_SITE_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now,
  };
  const retailSite: Restaurant = {
    id: RETAIL_SITE_ID, organizationId: RETAIL_ORGANIZATION_ID, slug: RETAIL_SITE_SLUG, name: 'Nova Goods',
    ownerUserId: retailOwner.id, status: 'active', vertical: 'retail', brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  };
  const retailBrand: BrandSettings = {
    restaurantId: RETAIL_SITE_ID,
    restaurantName: 'Nova Goods',
    tagline: 'Thoughtfully made, delivered.',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'sapphire',
    primaryFont: 'DM Sans',
    headingFont: 'Montserrat',
    fontWeight: 'medium',
    buttonStyle: 'square',
    borderRadius: 'sm',
    navPosition: 'center',
    socialLinks: { instagram: '' },
    contact: { phone: '+1 (415) 555-0198', email: 'hello@novagoods.shop', address: '221 Valencia Street, San Francisco, CA' },
    description: 'Nova Goods is an independent lifestyle & home goods shop - small-batch makers, thoughtfully curated.',
    cuisineType: '',
    businessHours: [
      { day: 'mon', isClosed: false, openTime: '10:00', closeTime: '19:00' },
      { day: 'tue', isClosed: false, openTime: '10:00', closeTime: '19:00' },
      { day: 'wed', isClosed: false, openTime: '10:00', closeTime: '19:00' },
      { day: 'thu', isClosed: false, openTime: '10:00', closeTime: '19:00' },
      { day: 'fri', isClosed: false, openTime: '10:00', closeTime: '19:00' },
      { day: 'sat', isClosed: false, openTime: '10:00', closeTime: '18:00' },
      { day: 'sun', isClosed: true, openTime: null, closeTime: null },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const retailHeroSection: HomepageSection = {
    id: 'section_novagoods_hero', restaurantId: RETAIL_SITE_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
    content: {
      eyebrow: 'San Francisco, CA',
      heading: 'Nova Goods',
      description: 'Independent lifestyle & home goods - small-batch makers, thoughtfully curated.',
      buttonText: 'Shop Now',
      buttonLink: '#/menu',
      secondaryButtonText: 'View Collection',
      secondaryButtonLink: '#/items',
      backgroundMediaId: null,
      overlayOpacity: 35,
    },
  };
  const retailSeed = buildRetailSeed(RETAIL_SITE_ID, now, retailHeroSection);
  const retailHomepage: Homepage = { restaurantId: RETAIL_SITE_ID, status: 'published', sections: retailSeed.sections };
  const retailMembershipPlans: MembershipPlan[] = [
    { id: 'plan_novagoods_free', restaurantId: RETAIL_SITE_ID, name: 'Loyalty', description: 'Free to join - earn points on every order.', priceCents: 0, billingInterval: 'one_time', benefits: ['Points on every order', 'Birthday reward'], isActive: true, order: 0, createdAt: now, updatedAt: now },
    { id: 'plan_novagoods_vip', restaurantId: RETAIL_SITE_ID, name: 'VIP', description: 'For our most loyal shoppers.', priceCents: 4000, billingInterval: 'yearly', benefits: ['Free shipping', 'Early access to drops', 'Exclusive discounts'], isActive: true, order: 1, createdAt: now, updatedAt: now },
  ];
  const retailAvailability: ReservationAvailabilitySettings = {
    restaurantId: RETAIL_SITE_ID,
    days: WEEK_DAYS.map((day) => ({ day, isClosed: day === 'sun', openTime: '10:00', closeTime: '19:00', slotDurationMins: 30, maxPerSlot: 1, slots: [] })),
    blockedDates: [],
  };

  // --- Salon demo tenant (own Org/login) - Plan §2/§6, the fourth Vertical. ---
  const salonOrganization: Organization = { id: SALON_ORGANIZATION_ID, code: SALON_ORGANIZATION_CODE, name: 'Sloane & Co. Salon', createdAt: now, updatedAt: now };
  const salonOwner: User = {
    id: 'user_sloaneco_owner', organizationId: SALON_ORGANIZATION_ID, email: 'owner@sloaneandco.com', name: 'Sloane Mitchell',
    role: 'owner', restaurantId: SALON_SITE_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now,
  };
  const salonSite: Restaurant = {
    id: SALON_SITE_ID, organizationId: SALON_ORGANIZATION_ID, slug: SALON_SITE_SLUG, name: 'Sloane & Co. Salon',
    ownerUserId: salonOwner.id, status: 'active', vertical: 'salon', brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  };
  const salonBrand: BrandSettings = {
    restaurantId: SALON_SITE_ID,
    restaurantName: 'Sloane & Co. Salon',
    tagline: 'Hair, nails & skin - beautifully done.',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'rosewood',
    primaryFont: 'Lato',
    headingFont: 'Playfair Display',
    fontWeight: 'regular',
    buttonStyle: 'pill',
    borderRadius: 'lg',
    navPosition: 'center',
    socialLinks: { instagram: 'https://instagram.com/sloaneandco', facebook: '' },
    contact: { phone: '+1 (512) 555-0176', email: 'hello@sloaneandco.com', address: '2201 S Lamar Blvd, Austin, TX 78704' },
    description: 'Sloane & Co. is a full-service Austin salon - expert cuts, color, nails and skin care, with easy online booking.',
    cuisineType: '',
    businessHours: [
      { day: 'mon', isClosed: true, openTime: null, closeTime: null },
      { day: 'tue', isClosed: false, openTime: '09:00', closeTime: '20:00' },
      { day: 'wed', isClosed: false, openTime: '09:00', closeTime: '20:00' },
      { day: 'thu', isClosed: false, openTime: '09:00', closeTime: '20:00' },
      { day: 'fri', isClosed: false, openTime: '09:00', closeTime: '19:00' },
      { day: 'sat', isClosed: false, openTime: '08:00', closeTime: '18:00' },
      { day: 'sun', isClosed: false, openTime: '10:00', closeTime: '16:00' },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const salonHeroSection: HomepageSection = {
    id: 'section_sloaneco_hero', restaurantId: SALON_SITE_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
    content: {
      eyebrow: 'South Lamar · Austin, TX',
      heading: 'Sloane & Co. Salon',
      description: 'Expert cuts, lived-in color, flawless nails and glowing skin - book your stylist online in under a minute.',
      buttonText: 'Book an Appointment',
      buttonLink: '#/reservations',
      secondaryButtonText: 'View Services',
      secondaryButtonLink: '#/items',
      backgroundMediaId: null,
      overlayOpacity: 45,
    },
  };
  const salonSeed = buildSalonSeed(SALON_SITE_ID, now, salonHeroSection);
  const salonHomepage: Homepage = { restaurantId: SALON_SITE_ID, status: 'published', sections: salonSeed.sections };
  const salonMembershipPlans: MembershipPlan[] = [
    { id: 'plan_sloaneco_blowout', restaurantId: SALON_SITE_ID, name: 'Blowout Club', description: 'Salon-fresh hair, every single week.', priceCents: 16900, billingInterval: 'monthly', benefits: ['4 signature blowouts a month', 'Priority weekend booking', '10% off take-home haircare'], isActive: true, order: 0, createdAt: now, updatedAt: now },
    { id: 'plan_sloaneco_glow', restaurantId: SALON_SITE_ID, name: 'Glow Membership', description: 'A monthly facial and a little extra for your skin.', priceCents: 11900, billingInterval: 'monthly', benefits: ['1 signature facial a month', 'Complimentary brow tidy', '15% off add-on services'], isActive: true, order: 1, createdAt: now, updatedAt: now },
    { id: 'plan_sloaneco_vip', restaurantId: SALON_SITE_ID, name: 'Sloane VIP', description: 'Our best perks, all year long.', priceCents: 29900, billingInterval: 'yearly', benefits: ['$25 birthday credit', 'Early access to new stylists & services', 'Free bond-repair add-on with every color'], isActive: true, order: 2, createdAt: now, updatedAt: now },
  ];
  const salonAvailability: ReservationAvailabilitySettings = {
    restaurantId: SALON_SITE_ID,
    days: WEEK_DAYS.map((day) => ({
      day,
      isClosed: day === 'mon',
      openTime: day === 'sun' ? '10:00' : '09:00',
      closeTime: day === 'sun' ? '16:00' : day === 'sat' ? '18:00' : '19:00',
      slotDurationMins: 30,
      maxPerSlot: 3,
      slots: [],
    })),
    blockedDates: [],
  };

  // --- Coffee Shop demo tenant (own Org/login) - Plan §2/§6, the fifth Vertical. ---
  const coffeeOrganization: Organization = { id: COFFEE_ORGANIZATION_ID, code: COFFEE_ORGANIZATION_CODE, name: 'Fernwood Coffee Co.', createdAt: now, updatedAt: now };
  const coffeeOwner: User = {
    id: 'user_fernwood_owner', organizationId: COFFEE_ORGANIZATION_ID, email: 'owner@fernwoodcoffee.com', name: 'Owen Castillo',
    role: 'owner', restaurantId: COFFEE_SITE_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now,
  };
  const coffeeSite: Restaurant = {
    id: COFFEE_SITE_ID, organizationId: COFFEE_ORGANIZATION_ID, slug: COFFEE_SITE_SLUG, name: 'Fernwood Coffee Co.',
    ownerUserId: coffeeOwner.id, status: 'active', vertical: 'coffee', brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  };
  const coffeeBrand: BrandSettings = {
    restaurantId: COFFEE_SITE_ID,
    restaurantName: 'Fernwood Coffee Co.',
    tagline: 'Small-batch roasted. Big enough to linger.',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'espresso',
    primaryFont: 'Roboto',
    headingFont: 'DM Sans',
    fontWeight: 'medium',
    buttonStyle: 'rounded',
    borderRadius: 'md',
    navPosition: 'right',
    socialLinks: { instagram: 'https://instagram.com/fernwoodcoffeeco', facebook: '' },
    contact: { phone: '+1 (206) 555-0139', email: 'hello@fernwoodcoffee.com', address: '3512 Fremont Ave N, Seattle, WA 98103' },
    description: 'Fernwood Coffee Co. is a small-batch roaster and neighborhood cafe in Fremont, Seattle - order ahead, or stay a while.',
    cuisineType: '',
    businessHours: [
      { day: 'mon', isClosed: false, openTime: '06:00', closeTime: '18:00' },
      { day: 'tue', isClosed: false, openTime: '06:00', closeTime: '18:00' },
      { day: 'wed', isClosed: false, openTime: '06:00', closeTime: '18:00' },
      { day: 'thu', isClosed: false, openTime: '06:00', closeTime: '18:00' },
      { day: 'fri', isClosed: false, openTime: '06:00', closeTime: '19:00' },
      { day: 'sat', isClosed: false, openTime: '07:00', closeTime: '19:00' },
      { day: 'sun', isClosed: false, openTime: '07:00', closeTime: '17:00' },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const coffeeHeroSection: HomepageSection = {
    id: 'section_fernwood_hero', restaurantId: COFFEE_SITE_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
    content: {
      eyebrow: 'Fremont · Seattle, WA',
      heading: 'Fernwood Coffee Co.',
      description: 'Small-batch roasted coffee, fresh-baked pastries and a room built for staying a while - order ahead for pickup.',
      buttonText: 'Order Ahead',
      buttonLink: '#/menu',
      secondaryButtonText: 'View Menu',
      secondaryButtonLink: '#/items',
      backgroundMediaId: null,
      overlayOpacity: 45,
    },
  };
  const coffeeSeed = buildCoffeeSeed(COFFEE_SITE_ID, now, coffeeHeroSection);
  const coffeeHomepage: Homepage = { restaurantId: COFFEE_SITE_ID, status: 'published', sections: coffeeSeed.sections };
  const coffeeMembershipPlans: MembershipPlan[] = [
    { id: 'plan_fernwood_rewards', restaurantId: COFFEE_SITE_ID, name: 'Fernwood Rewards', description: 'Free to join - earn a point on every order.', priceCents: 0, billingInterval: 'one_time', benefits: ['1 point per $1 spent', 'Free drink at 100 points', 'Birthday drink on us'], isActive: true, order: 0, createdAt: now, updatedAt: now },
    { id: 'plan_fernwood_subscriber', restaurantId: COFFEE_SITE_ID, name: 'Coffee Subscriber', description: 'A bag of house-roast beans, delivered monthly, plus in-shop perks.', priceCents: 1800, billingInterval: 'monthly', benefits: ['12oz bag of beans every month', '10% off in-shop orders', 'Early access to seasonal roasts'], isActive: true, order: 1, createdAt: now, updatedAt: now },
  ];
  const coffeeAvailability: ReservationAvailabilitySettings = {
    restaurantId: COFFEE_SITE_ID,
    days: WEEK_DAYS.map((day) => ({
      day,
      isClosed: false,
      openTime: day === 'sat' || day === 'sun' ? '07:00' : '06:00',
      closeTime: day === 'fri' || day === 'sat' ? '19:00' : day === 'sun' ? '17:00' : '18:00',
      slotDurationMins: 30,
      maxPerSlot: 6,
      slots: [],
    })),
    blockedDates: [],
  };

  // --- Laundry demo tenant (own Org/login) - Plan §2/§6, the sixth Vertical. ---
  const laundryOrganization: Organization = { id: LAUNDRY_ORGANIZATION_ID, code: LAUNDRY_ORGANIZATION_CODE, name: 'Brightside Laundry Co.', createdAt: now, updatedAt: now };
  const laundryOwner: User = {
    id: 'user_brightside_owner', organizationId: LAUNDRY_ORGANIZATION_ID, email: 'owner@brightsidelaundry.com', name: 'Maria Delgado',
    role: 'owner', restaurantId: LAUNDRY_SITE_ID, siteAccess: 'all', isActive: true, createdAt: now, updatedAt: now,
  };
  const laundrySite: Restaurant = {
    id: LAUNDRY_SITE_ID, organizationId: LAUNDRY_ORGANIZATION_ID, slug: LAUNDRY_SITE_SLUG, name: 'Brightside Laundry Co.',
    ownerUserId: laundryOwner.id, status: 'active', vertical: 'laundry', brandingBadgeEnabled: true, createdAt: now, updatedAt: now,
  };
  const laundryBrand: BrandSettings = {
    restaurantId: LAUNDRY_SITE_ID,
    restaurantName: 'Brightside Laundry Co.',
    tagline: 'Laundry day, handled with care.',
    logoMediaId: null,
    faviconMediaId: null,
    themePresetId: 'aqua',
    primaryFont: 'Inter',
    headingFont: 'DM Sans',
    fontWeight: 'medium',
    buttonStyle: 'rounded',
    borderRadius: 'lg',
    navPosition: 'right',
    socialLinks: { instagram: 'https://instagram.com/brightsidelaundry', facebook: '' },
    contact: { phone: '+1 (718) 555-0148', email: 'hello@brightsidelaundry.com', address: '215 5th Ave, Park Slope, Brooklyn, NY 11217' },
    description: 'Brightside Laundry Co. is a family-owned laundry and dry cleaner in Park Slope, Brooklyn - everything cleaned in-house, with free pickup and delivery.',
    cuisineType: '',
    businessHours: [
      { day: 'mon', isClosed: false, openTime: '07:00', closeTime: '20:00' },
      { day: 'tue', isClosed: false, openTime: '07:00', closeTime: '20:00' },
      { day: 'wed', isClosed: false, openTime: '07:00', closeTime: '20:00' },
      { day: 'thu', isClosed: false, openTime: '07:00', closeTime: '20:00' },
      { day: 'fri', isClosed: false, openTime: '07:00', closeTime: '20:00' },
      { day: 'sat', isClosed: false, openTime: '08:00', closeTime: '18:00' },
      { day: 'sun', isClosed: false, openTime: '09:00', closeTime: '17:00' },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const laundryHeroSection: HomepageSection = {
    id: 'section_brightside_hero', restaurantId: LAUNDRY_SITE_ID, type: 'hero', order: 1, visible: true, templateVariant: 'a', updatedAt: now,
    content: {
      eyebrow: 'Park Slope · Brooklyn, NY',
      heading: 'Brightside Laundry Co.',
      description: 'Dry cleaning, wash & fold and alterations - all cleaned in-house, with free pickup and delivery on every order over $35.',
      buttonText: 'Schedule a Pickup',
      buttonLink: '#/reservations',
      secondaryButtonText: 'View Services',
      secondaryButtonLink: '#/items',
      backgroundMediaId: null,
      overlayOpacity: 45,
    },
  };
  const laundrySeed = buildLaundrySeed(LAUNDRY_SITE_ID, now, laundryHeroSection);
  const laundryHomepage: Homepage = { restaurantId: LAUNDRY_SITE_ID, status: 'published', sections: laundrySeed.sections };
  const laundryMembershipPlans: MembershipPlan[] = [
    { id: 'plan_brightside_basic', restaurantId: LAUNDRY_SITE_ID, name: 'Brightside Basic', description: 'Free to join - earn credit toward every order.', priceCents: 0, billingInterval: 'one_time', benefits: ['5% credit on every order', 'Free pickup & delivery', 'Birthday bonus credit'], isActive: true, order: 0, createdAt: now, updatedAt: now },
    { id: 'plan_brightside_unlimited', restaurantId: LAUNDRY_SITE_ID, name: 'Unlimited Wash & Fold', description: 'Unlimited wash & fold, up to 30 lbs a week.', priceCents: 12900, billingInterval: 'monthly', benefits: ['Up to 30 lbs a week', 'Priority same-day slots', '15% off dry cleaning'], isActive: true, order: 1, createdAt: now, updatedAt: now },
  ];
  const laundryAvailability: ReservationAvailabilitySettings = {
    restaurantId: LAUNDRY_SITE_ID,
    days: WEEK_DAYS.map((day) => ({
      day,
      isClosed: false,
      openTime: day === 'sun' ? '09:00' : day === 'sat' ? '08:00' : '07:00',
      closeTime: day === 'sun' ? '17:00' : day === 'sat' ? '18:00' : '20:00',
      slotDurationMins: 30,
      maxPerSlot: 5,
      slots: [],
    })),
    blockedDates: [],
  };

  return {
    organizations: [...organizations, gymOrganization, retailOrganization, salonOrganization, coffeeOrganization, laundryOrganization],
    users: [...users, gymOwner, retailOwner, salonOwner, coffeeOwner, laundryOwner],
    restaurants: [restaurant, secondSite, gymSite, retailSite, salonSite, coffeeSite, laundrySite],
    brand: {
      [RESTAURANT_ID]: { draft: { ...brandSettings }, published: { ...brandSettings } },
      [SECOND_SITE_ID]: { draft: { ...secondSiteBrand }, published: { ...secondSiteBrand } },
      [GYM_SITE_ID]: { draft: { ...gymBrand }, published: { ...gymBrand } },
      [RETAIL_SITE_ID]: { draft: { ...retailBrand }, published: { ...retailBrand } },
      [SALON_SITE_ID]: { draft: { ...salonBrand }, published: { ...salonBrand } },
      [COFFEE_SITE_ID]: { draft: { ...coffeeBrand }, published: { ...coffeeBrand } },
      [LAUNDRY_SITE_ID]: { draft: { ...laundryBrand }, published: { ...laundryBrand } },
    },
    website: {
      [RESTAURANT_ID]: {
        restaurantId: RESTAURANT_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'Lumière | Fine Dining Mayfair',
        seoDescription: 'Modern French fine dining in Mayfair, London.',
        createdAt: now,
        updatedAt: now,
      },
      [SECOND_SITE_ID]: {
        restaurantId: SECOND_SITE_ID,
        publishStatus: 'draft',
        publishedAt: null,
        seoTitle: 'Lumière – Notting Hill',
        seoDescription: 'Modern French fine dining in Notting Hill, London.',
        createdAt: now,
        updatedAt: now,
      },
      [GYM_SITE_ID]: {
        restaurantId: GYM_SITE_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'PulseFit Studios | Strength & Conditioning',
        seoDescription: 'Small-group strength & conditioning gym in Chicago, IL.',
        createdAt: now,
        updatedAt: now,
      },
      [RETAIL_SITE_ID]: {
        restaurantId: RETAIL_SITE_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'Nova Goods | Lifestyle & Home Goods',
        seoDescription: 'Independent lifestyle & home goods shop in San Francisco, CA.',
        createdAt: now,
        updatedAt: now,
      },
      [SALON_SITE_ID]: {
        restaurantId: SALON_SITE_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'Sloane & Co. Salon | Hair, Nails & Skin in Austin, TX',
        seoDescription: 'Full-service hair salon on South Lamar in Austin, TX - cuts, balayage, blowouts, nails and facials. Book online.',
        createdAt: now,
        updatedAt: now,
      },
      [COFFEE_SITE_ID]: {
        restaurantId: COFFEE_SITE_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'Fernwood Coffee Co. | Coffee Shop in Fremont, Seattle',
        seoDescription: 'Small-batch roasted coffee, pastries and order-ahead pickup in Fremont, Seattle, WA.',
        createdAt: now,
        updatedAt: now,
      },
      [LAUNDRY_SITE_ID]: {
        restaurantId: LAUNDRY_SITE_ID,
        publishStatus: 'published',
        publishedAt: now,
        seoTitle: 'Brightside Laundry Co. | Laundry & Dry Cleaning in Park Slope, Brooklyn',
        seoDescription: 'Family-owned laundry and dry cleaner in Park Slope, Brooklyn, NY - free pickup and delivery. Schedule online.',
        createdAt: now,
        updatedAt: now,
      },
    },
    homepage: {
      [RESTAURANT_ID]: { draft: homepageDraft, published: homepagePublished },
      [SECOND_SITE_ID]: { draft: { ...secondSiteHomepage }, published: { ...secondSiteHomepage } },
      [GYM_SITE_ID]: { draft: { ...gymHomepage }, published: { ...gymHomepage } },
      [RETAIL_SITE_ID]: { draft: { ...retailHomepage }, published: { ...retailHomepage } },
      [SALON_SITE_ID]: { draft: { ...salonHomepage }, published: { ...salonHomepage } },
      [COFFEE_SITE_ID]: { draft: { ...coffeeHomepage }, published: { ...coffeeHomepage } },
      [LAUNDRY_SITE_ID]: { draft: { ...laundryHomepage }, published: { ...laundryHomepage } },
    },
    media: [...media, ...gymSeed.media, ...retailSeed.media, ...salonSeed.media, ...coffeeSeed.media, ...laundrySeed.media],
    categories: [...categories, ...gymSeed.categories, ...retailSeed.categories, ...salonSeed.categories, ...coffeeSeed.categories, ...laundrySeed.categories],
    items: [...items, ...gymSeed.items, ...retailSeed.items, ...salonSeed.items, ...coffeeSeed.items, ...laundrySeed.items],
    addons,
    offers: [...offers, ...gymSeed.offers, ...retailSeed.offers, ...salonSeed.offers, ...coffeeSeed.offers, ...laundrySeed.offers],
    orders,
    reservations,
    reservationAvailability: {
      [RESTAURANT_ID]: reservationAvailabilitySettings,
      [SECOND_SITE_ID]: { ...reservationAvailabilitySettings, restaurantId: SECOND_SITE_ID },
      [GYM_SITE_ID]: gymAvailability,
      [RETAIL_SITE_ID]: retailAvailability,
      [SALON_SITE_ID]: salonAvailability,
      [COFFEE_SITE_ID]: coffeeAvailability,
      [LAUNDRY_SITE_ID]: laundryAvailability,
    },
    pageConfigs: [
      ...buildDefaultPageConfigs(RESTAURANT_ID, true),
      ...buildDefaultPageConfigs(SECOND_SITE_ID),
      ...buildPageConfigsForVertical(GYM_SITE_ID, 'gym'),
      ...buildPageConfigsForVertical(RETAIL_SITE_ID, 'retail'),
      ...buildPageConfigsForVertical(SALON_SITE_ID, 'salon'),
      ...buildPageConfigsForVertical(COFFEE_SITE_ID, 'coffee'),
      ...buildPageConfigsForVertical(LAUNDRY_SITE_ID, 'laundry'),
    ],
    membershipPlans: [...membershipPlans, ...gymMembershipPlans, ...retailMembershipPlans, ...salonMembershipPlans, ...coffeeMembershipPlans, ...laundryMembershipPlans],
    members,
    memberCheckIns,
    domainMappings: [
      ...buildDefaultDomainMappings(RESTAURANT_ID, RESTAURANT_SLUG),
      ...buildDefaultDomainMappings(SECOND_SITE_ID, SECOND_SITE_SLUG),
      ...buildDefaultDomainMappings(GYM_SITE_ID, GYM_SITE_SLUG),
      ...buildDefaultDomainMappings(RETAIL_SITE_ID, RETAIL_SITE_SLUG),
      ...buildDefaultDomainMappings(SALON_SITE_ID, SALON_SITE_SLUG),
      ...buildDefaultDomainMappings(COFFEE_SITE_ID, COFFEE_SITE_SLUG),
      ...buildDefaultDomainMappings(LAUNDRY_SITE_ID, LAUNDRY_SITE_SLUG),
    ],
    // Every Site starts on the code defaults for its Vertical; owners only store what they change.
    pageContent: Object.fromEntries(
      [RESTAURANT_ID, SECOND_SITE_ID, GYM_SITE_ID, RETAIL_SITE_ID, SALON_SITE_ID, COFFEE_SITE_ID, LAUNDRY_SITE_ID].map((id) => [id, { draft: {}, published: {} }]),
    ),
  };
}

const DEMO_EMAILS = ['owner@lumiere.com', 'staff@lumiere.com', 'admin@platform.com'];

function hasDemoUsers() {
  const emails = new Set(db.data.users.map((u) => u.email.toLowerCase()));
  return DEMO_EMAILS.every((email) => emails.has(email));
}

export function ensureSeeded() {
  if (db.isEmpty()) {
    db.reset(buildSeed());
    return;
  }
  if (hasDemoUsers()) return;
  const seeded = buildSeed().users;
  for (const user of seeded) {
    if (!db.data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
      db.data.users.push(user);
    }
  }
  db.save();
}

export function resetSeed() {
  db.reset(buildSeed());
}
