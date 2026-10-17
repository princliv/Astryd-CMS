import type { PublicLocation } from './sites';

const MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const SLUG_PATH = /^\/s\/[^/]+/;
// A Reserve handoff names one specific outlet, so it must not follow the guest to another one.
const OUTLET_SCOPED_PARAMS = ['reserve_date', 'reserve_time', 'reserve_party', 'reserve_business', 'source'];

/**
 * The same page (`hash`) on another outlet of this Organization, addressed the way the current page was reached:
 * `?site=` (admin preview / mock mode), `/s/:slug`, or the outlet's platform subdomain.
 */
export function outletUrl(target: Pick<PublicLocation, 'id' | 'slug'>, hash: string): string {
  const url = new URL(window.location.href);
  for (const name of OUTLET_SCOPED_PARAMS) url.searchParams.delete(name);
  url.hash = hash;

  if (MOCKS || url.searchParams.has('site')) {
    url.searchParams.set('site', target.id);
    return url.toString();
  }
  if (SLUG_PATH.test(url.pathname)) {
    url.pathname = url.pathname.replace(SLUG_PATH, `/s/${target.slug}`);
    return url.toString();
  }
  const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN as string | undefined;
  if (platformDomain && url.hostname.endsWith(`.${platformDomain}`)) {
    url.hostname = `${target.slug}.${platformDomain}`;
    return url.toString();
  }
  url.pathname = `/s/${target.slug}`;
  return url.toString();
}
