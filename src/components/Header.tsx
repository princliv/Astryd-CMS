import React, { useState } from 'react';
import { usePublicData } from '../context/PublicDataContext';
import { usePageContent } from '../context/usePageContent';
import { LocationSwitcher } from './locations/LocationSwitcher';

interface HeaderProps {
  currentPage: 'landing' | 'items' | 'menu' | 'reservations' | 'membership' | 'locations';
  onNavigateLanding: () => void;
  onNavigateMenu: () => void;
  onNavigateReservations: () => void;
  /** Optional - a Header rendered inside a page that has no direct reference to App's page state falls back to a hash-based navigation, since Items is a newer, sometimes-disabled module (Multi-Vertical Platform Plan §8.5). */
  onNavigateItems?: () => void;
  /** Optional - a Header rendered inside a page that has no direct reference to App's page state falls back to a hash-based navigation, since Membership is a newer, sometimes-disabled module (Multi-Vertical Platform Plan §8.4). */
  onNavigateMembership?: () => void;
  onToast?: (msg: string) => void;
  cartUniqueCount?: number;
  onOpenCart?: () => void;
}

interface NavItem {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface ResolvedHeader {
  logoUrl?: string;
  brandName: string;
  onNavigateLanding: () => void;
  navItems: NavItem[];
  cartButton: React.ReactNode;
  headerStyle: React.CSSProperties & Record<string, string | undefined>;
  navLinkInactiveClass: string;
  navPosition: 'right' | 'center';
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  mobileMenuAriaLabel: string;
}

function DesktopNavLink({ item, inactiveClass }: { item: NavItem; inactiveClass: string }) {
  return (
    <button
      onClick={item.onClick}
      className={`font-sans text-sm tracking-wide py-1 font-medium transition-colors relative ${
        item.active
          ? 'text-primary font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
          : inactiveClass
      }`}
    >
      {item.label}
    </button>
  );
}

function MobileNavLink({ item, inactiveClass, onNavigated }: { item: NavItem; inactiveClass: string; onNavigated: () => void }) {
  return (
    <button
      onClick={() => {
        item.onClick();
        onNavigated();
      }}
      className={`block w-full text-left font-sans text-base py-2.5 font-medium transition-colors ${item.active ? 'text-primary font-bold' : inactiveClass}`}
    >
      {item.label}
    </button>
  );
}

function Logo({ logoUrl, brandName, onNavigateLanding, className = '' }: { logoUrl?: string; brandName: string; onNavigateLanding: () => void; className?: string }) {
  return (
    <div onClick={onNavigateLanding} className={`font-serif text-2xl sm:text-3xl tracking-tight font-semibold text-on-surface flex items-center gap-2.5 cursor-pointer group ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" />
      ) : (
        <span className="material-symbols-outlined text-primary text-2.5xl group-hover:rotate-12 transition-transform duration-300">auto_awesome</span>
      )}
      <span className="group-hover:text-primary transition-colors">{brandName}</span>
    </div>
  );
}

function MobileMenuDrawer({ navItems, inactiveClass, headerBackgroundColor, onNavigated }: { navItems: NavItem[]; inactiveClass: string; headerBackgroundColor?: string; onNavigated: () => void }) {
  return (
    <div style={{ backgroundColor: headerBackgroundColor }} className="bg-surface border-b border-outline-variant/20 px-6 py-5 space-y-3.5 animate-fadeIn shadow-xl">
      {navItems.map((item) => (
        <MobileNavLink key={item.key} item={item} inactiveClass={inactiveClass} onNavigated={onNavigated} />
      ))}
    </div>
  );
}

/** Layout A - Classic: one row, logo and nav side by side (nav position follows the existing brand setting). */
function HeaderA({ logoUrl, brandName, onNavigateLanding, navItems, cartButton, headerStyle, navLinkInactiveClass, navPosition, isMobileMenuOpen, setIsMobileMenuOpen, mobileMenuAriaLabel }: ResolvedHeader) {
  return (
    <header style={headerStyle} className="fixed top-0 left-0 right-0 z-50 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.04)] h-20 border-b border-outline-variant/20 transition-all">
      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-full flex justify-between items-center">
        <Logo logoUrl={logoUrl} brandName={brandName} onNavigateLanding={onNavigateLanding} />

        <div className="hidden md:flex items-center gap-3">
          <nav className={`flex items-center space-x-9 ${navPosition === 'center' ? 'absolute left-1/2 top-0 h-full -translate-x-1/2 flex items-center' : ''}`}>
            {navItems.map((item) => (
              <DesktopNavLink key={item.key} item={item} inactiveClass={navLinkInactiveClass} />
            ))}
          </nav>
          {cartButton}
        </div>

        <div className="md:hidden flex items-center gap-1">
          {cartButton}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-low transition-colors" aria-label={mobileMenuAriaLabel}>
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <MobileMenuDrawer navItems={navItems} inactiveClass={navLinkInactiveClass} headerBackgroundColor={headerStyle.backgroundColor as string | undefined} onNavigated={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}

/** Layout B - Editorial: two rows - logo centered on top, nav links centered below it, cart in the corner. */
function HeaderB({ logoUrl, brandName, onNavigateLanding, navItems, cartButton, headerStyle, navLinkInactiveClass, isMobileMenuOpen, setIsMobileMenuOpen, mobileMenuAriaLabel }: ResolvedHeader) {
  return (
    <header style={headerStyle} className="fixed top-0 left-0 right-0 z-50 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-outline-variant/20 transition-all">
      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="relative h-16 flex items-center justify-center">
          <Logo logoUrl={logoUrl} brandName={brandName} onNavigateLanding={onNavigateLanding} />
          <div className="absolute right-margin-mobile md:right-margin-desktop top-1/2 -translate-y-1/2 flex items-center gap-1">
            <div className="hidden md:block">{cartButton}</div>
            <div className="md:hidden flex items-center gap-1">
              {cartButton}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-low transition-colors" aria-label={mobileMenuAriaLabel}>
                <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center justify-center gap-9 h-12 border-t border-outline-variant/15">
          {navItems.map((item) => (
            <DesktopNavLink key={item.key} item={item} inactiveClass={navLinkInactiveClass} />
          ))}
        </nav>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <MobileMenuDrawer navItems={navItems} inactiveClass={navLinkInactiveClass} headerBackgroundColor={headerStyle.backgroundColor as string | undefined} onNavigated={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}

/** Layout C - Minimal: a slim bar - nav links always collapse behind a Menu button, even on desktop. */
function HeaderC({ logoUrl, brandName, onNavigateLanding, navItems, cartButton, headerStyle, navLinkInactiveClass, isMobileMenuOpen, setIsMobileMenuOpen, mobileMenuAriaLabel }: ResolvedHeader) {
  return (
    <header style={headerStyle} className="fixed top-0 left-0 right-0 z-50 bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.04)] h-16 border-b border-outline-variant/20 transition-all">
      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-full flex justify-between items-center">
        <Logo logoUrl={logoUrl} brandName={brandName} onNavigateLanding={onNavigateLanding} className="text-xl sm:text-2xl" />
        <div className="flex items-center gap-1">
          {cartButton}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-10 px-3 flex items-center gap-1.5 text-on-surface rounded-full hover:bg-surface-container-low transition-colors text-sm font-semibold"
            aria-label={mobileMenuAriaLabel}
          >
            <span className="material-symbols-outlined text-xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && <MobileMenuDrawer navItems={navItems} inactiveClass={navLinkInactiveClass} headerBackgroundColor={headerStyle.backgroundColor as string | undefined} onNavigated={() => setIsMobileMenuOpen(false)} />}
    </header>
  );
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigateLanding,
  onNavigateMenu,
  onNavigateReservations,
  onNavigateItems,
  onNavigateMembership,
  cartUniqueCount = 0,
  onOpenCart,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { brand, mediaMap, getNavLabel, isModuleEnabled, getChromeVariant } = usePublicData();
  const c = usePageContent('global');
  const brandName = brand?.restaurantName ?? 'Lumière';
  const itemsEnabled = isModuleEnabled('items');
  const membershipEnabled = isModuleEnabled('membership');
  const catalogEnabled = isModuleEnabled('catalog');
  const bookingEnabled = isModuleEnabled('booking');
  const goItems = onNavigateItems ?? (() => { window.location.hash = '#/items'; });
  const goMembership = onNavigateMembership ?? (() => { window.location.hash = '#/membership'; });
  const logoUrl = brand?.logoMediaId ? mediaMap.get(brand.logoMediaId)?.fileUrl : undefined;

  const headerStyle: React.CSSProperties & Record<string, string | undefined> = {
    backgroundColor: brand?.headerBackgroundColor,
    '--nav-color': brand?.headerTextColor,
    '--nav-hover-color': brand?.headerTextHoverColor,
  };
  const navLinkInactiveClass = 'text-[var(--nav-color,#5f5e5e)] hover:text-[var(--nav-hover-color,#1b1c1c)]';

  const navItems: NavItem[] = [
    { key: 'landing', label: c.text('navHomeLabel'), active: currentPage === 'landing', onClick: onNavigateLanding },
    ...(itemsEnabled ? [{ key: 'items', label: getNavLabel('items', 'Menu'), active: currentPage === 'items', onClick: goItems }] : []),
    ...(catalogEnabled ? [{ key: 'menu', label: getNavLabel('catalog', 'Menu'), active: currentPage === 'menu', onClick: onNavigateMenu }] : []),
    ...(bookingEnabled ? [{ key: 'reservations', label: getNavLabel('booking', 'Reservation'), active: currentPage === 'reservations', onClick: onNavigateReservations }] : []),
    ...(membershipEnabled ? [{ key: 'membership', label: getNavLabel('membership', 'Membership'), active: currentPage === 'membership', onClick: goMembership }] : []),
  ];

  const cartButton = (brand?.showCart ?? true) && onOpenCart ? (
    <button
      type="button"
      id="header-cart-btn"
      onClick={onOpenCart}
      className="relative w-10 h-10 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-low transition-colors"
      aria-label={cartUniqueCount > 0 ? c.text('cartAriaLabelWithCount', { count: cartUniqueCount }) : c.text('cartAriaLabel')}
    >
      <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
      {cartUniqueCount > 0 && (
        <span
          key={cartUniqueCount}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center leading-none shadow-sm header-cart-badge-pop"
        >
          {cartUniqueCount > 99 ? '99+' : cartUniqueCount}
        </span>
      )}
    </button>
  ) : null;

  const resolved: ResolvedHeader = {
    logoUrl,
    brandName,
    onNavigateLanding,
    navItems,
    // The location switcher sits beside the cart in every layout (it renders nothing for a single-outlet business).
    cartButton: (
      <>
        <LocationSwitcher />
        {cartButton}
      </>
    ),
    headerStyle,
    navLinkInactiveClass,
    navPosition: brand?.navPosition ?? 'right',
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    mobileMenuAriaLabel: c.text('mobileMenuAriaLabel'),
  };

  const variant = getChromeVariant('header');
  if (variant === 'b') return <HeaderB {...resolved} />;
  if (variant === 'c') return <HeaderC {...resolved} />;
  return <HeaderA {...resolved} />;
};
