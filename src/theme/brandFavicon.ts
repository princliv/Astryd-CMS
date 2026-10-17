import { CUSTOM_THEME_ID, THEME_PRESETS, type BrandSettings } from '../types';
import { isValidHexColor } from './paletteFromColor';

type FaviconBrand = Pick<BrandSettings, 'restaurantName' | 'themePresetId' | 'customPrimaryColor'>;

function brandColor(brand: FaviconBrand) {
  const custom = brand.themePresetId === CUSTOM_THEME_ID ? brand.customPrimaryColor : undefined;
  if (custom && isValidHexColor(custom)) return custom;
  return (THEME_PRESETS.find((p) => p.id === brand.themePresetId) ?? THEME_PRESETS[0]).colors.primary;
}

/** A rounded tile with the business's first letter, for sites that haven't uploaded a logo. */
function monogramIcon(brand: FaviconBrand) {
  const letter = brand.restaurantName.match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase();
  if (!letter) return undefined;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${brandColor(brand)}"/>` +
    `<text x="32" y="44" text-anchor="middle" font-family="Georgia,serif" font-size="36" font-weight="700" fill="#fff">${letter}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Points the browser-tab icon at the site's own favicon or logo, falling back to a letter tile - never the Astryd mark. */
export function applyBrandFavicon(brand: FaviconBrand, iconUrl: string | undefined) {
  const href = iconUrl ?? monogramIcon(brand);
  if (!href) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  // The static Astryd icon declares image/svg+xml; an uploaded PNG/JPEG logo would be ignored under that type.
  link.removeAttribute('type');
  link.href = href;
}
