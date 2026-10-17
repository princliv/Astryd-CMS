import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { GalleryLightbox } from './components/GalleryLightbox';
import { ChefStoryModal } from './components/ChefStoryModal';
import { Toast } from './components/Toast';
import { CatalogView } from './components/catalog';
import { OrderSummaryView } from './components/OrderSummaryView';
import { BookingView } from './components/booking';
import { MembershipView } from './components/membership';
import { LocationsView } from './components/locations/LocationsView';
import { ItemsView } from './components/items';
import { LandingChrome } from './components/landing/LandingChrome';
import { ScrollToTop } from './components/ScrollToTop';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { PublicRestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { PublicDataProvider, usePublicData } from './context/PublicDataContext';
import { usePageContent } from './context/usePageContent';
import { usePreviewBridge } from './preview/usePreviewBridge';
import { ThemeProvider } from './theme/ThemeProvider';
import { applyBrandFavicon } from './theme/brandFavicon';
import { HeroSection } from './sections/HeroSection';
import { SectionRenderer } from './sections/SectionRenderer';
import { resolveGalleryImages } from './sections/galleryUtils';
import type { ResolvedGalleryImage } from './sections/GallerySection';
import {
  type CartState,
  getCartCount,
  getCartUniqueCount,
  addCartLine,
  updateCartLineQty,
  updateItemQty,
  removeCartLine,
  removeCartAddon,
  updateCartLineNote,
} from './data/menuItems';

type AppPage = 'landing' | 'items' | 'menu' | 'reservations' | 'membership' | 'checkout' | 'locations';

const CART_STORAGE_KEY = 'lumiere-cart';

function pageFromHash(): AppPage {
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (raw === 'items' || raw === 'menu' || raw === 'reservations' || raw === 'membership' || raw === 'checkout' || raw === 'locations') {
    return raw;
  }
  return 'landing';
}

function hashForPage(page: AppPage) {
  return page === 'landing' ? '#/' : `#/${page}`;
}

function loadCart(siteId: string): CartState {
  try {
    const raw = localStorage.getItem(`${CART_STORAGE_KEY}:${siteId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function AppShell() {
  const { restaurantId } = useRestaurant();
  const { brand, sections, mediaMap, items, offers, isLoading, vertical, isModuleEnabled, getSectionVariant } = usePublicData();
  // With online ordering switched off (e.g. a Salon), homepage "browse" buttons show the Items page and offers lead to booking.
  const browsePage: AppPage = isModuleEnabled('catalog') || !isModuleEnabled('items') ? 'menu' : 'items';
  const offerPage: AppPage = isModuleEnabled('catalog') || !isModuleEnabled('booking') ? browsePage : 'reservations';
  useEffect(() => {
    if (brand?.restaurantName) document.title = brand.restaurantName;
  }, [brand?.restaurantName]);
  const tabIconId = brand?.faviconMediaId ?? brand?.logoMediaId;
  const tabIconUrl = tabIconId ? mediaMap.get(tabIconId)?.fileUrl : undefined;
  useEffect(() => {
    if (brand) applyBrandFavicon(brand, tabIconUrl);
  }, [brand, tabIconUrl]);
  const checkoutContent = usePageContent('checkout');
  usePreviewBridge();
  const [currentPage, setCurrentPageState] = useState<AppPage>(() => pageFromHash());
  const [cart, setCart] = useState<CartState>(() => loadCart(restaurantId));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChefStoryOpen, setIsChefStoryOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStickyShadowed, setIsStickyShadowed] = useState(false);

  const setCurrentPage = useCallback((page: AppPage) => {
    setCurrentPageState(page);
    const next = hashForPage(page);
    if (window.location.hash !== next) {
      window.location.hash = next;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const page = pageFromHash();
      setCurrentPageState(page);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Every page change (nav links, buttons, redirects, back/forward) starts at the top. Layout effect so
  // the new page never paints at the old scroll position; 'instant' because <html> has scroll-smooth.
  // The first render is skipped so a reload keeps the browser's restored scroll position.
  const previousPageRef = useRef(currentPage);
  useEffect(() => {
    // Otherwise Back/Forward can restore the old page's position after we've already jumped to the top.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);
  useLayoutEffect(() => {
    if (previousPageRef.current === currentPage) return;
    previousPageRef.current = currentPage;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(`${CART_STORAGE_KEY}:${restaurantId}`, JSON.stringify(cart));
  }, [cart, restaurantId]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  const navigateFromLink = useCallback(
    (link: string) => {
      if (link.includes('reservation')) setCurrentPage('reservations');
      else if (link.includes('items')) setCurrentPage('items');
      else if (link.includes('menu')) setCurrentPage('menu');
      else if (link.includes('membership')) setCurrentPage('membership');
      else setCurrentPage('landing');
    },
    [setCurrentPage],
  );

  const handleUpdateItemQty = (itemId: string, delta: number) => {
    setCart((prev) => updateItemQty(prev, itemId, delta));
  };

  const handleUpdateLineQty = (lineId: string, delta: number) => {
    setCart((prev) => updateCartLineQty(prev, lineId, delta));
  };

  const handleRemoveLine = (lineId: string) => {
    setCart((prev) => removeCartLine(prev, lineId));
  };

  const handleRemoveAddon = (lineId: string, addonId: string) => {
    setCart((prev) => removeCartAddon(prev, lineId, addonId));
  };

  const handleUpdateLineNote = (lineId: string, note: string) => {
    setCart((prev) => updateCartLineNote(prev, lineId, note));
  };

  const handleAddToCart = (itemId: string, quantity: number, addonIds: string[] = []) => {
    setCart((prev) => addCartLine(prev, itemId, quantity, addonIds));
  };

  const handleCheckout = () => {
    if (getCartCount(cart) === 0) {
      triggerToast(checkoutContent.text('emptyCartToast'));
      return;
    }
    setIsCartOpen(false);
    setCurrentPage('checkout');
  };

  const cartUniqueCount = getCartUniqueCount(cart);

  const cartDrawer = (
    <CartDrawer
      isOpen={isCartOpen}
      cart={cart}
      onClose={() => setIsCartOpen(false)}
      onUpdateLineQty={handleUpdateLineQty}
      onRemoveLine={handleRemoveLine}
      onRemoveAddon={handleRemoveAddon}
      onCheckout={handleCheckout}
    />
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsStickyShadowed(true);
      } else {
        setIsStickyShadowed(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (currentPage === 'checkout') {
    return (
      <>
        <OrderSummaryView
          cart={cart}
          onClearCart={() => setCart([])}
          onUpdateLineQty={handleUpdateLineQty}
          onRemoveLine={handleRemoveLine}
          onRemoveAddon={handleRemoveAddon}
          onUpdateLineNote={handleUpdateLineNote}
          onNavigateLanding={() => setCurrentPage('landing')}
          onNavigateMenu={() => setCurrentPage('menu')}
          onNavigateReservations={() => setCurrentPage('reservations')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  if (currentPage === 'reservations') {
    return (
      <>
        <BookingView
          onNavigateLanding={() => setCurrentPage('landing')}
          onNavigateMenu={() => setCurrentPage('menu')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  if (currentPage === 'locations') {
    return (
      <>
        <LocationsView
          onNavigateLanding={() => setCurrentPage('landing')}
          onNavigateMenu={() => setCurrentPage('menu')}
          onNavigateReservations={() => setCurrentPage('reservations')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  if (currentPage === 'membership') {
    return (
      <>
        <MembershipView
          onNavigateLanding={() => setCurrentPage('landing')}
          onNavigateMenu={() => setCurrentPage('menu')}
          onNavigateReservations={() => setCurrentPage('reservations')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  if (currentPage === 'items') {
    return (
      <>
        <ItemsView
          onNavigateLanding={() => setCurrentPage('landing')}
          onNavigateMenu={() => setCurrentPage('menu')}
          onNavigateReservations={() => setCurrentPage('reservations')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  if (currentPage === 'menu') {
    return (
      <>
        <CatalogView
          cart={cart}
          onUpdateItemQty={handleUpdateItemQty}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckout}
          onBackToWebsite={() => setCurrentPage('landing')}
          onBookTable={() => setCurrentPage('reservations')}
          onToast={triggerToast}
          cartUniqueCount={cartUniqueCount}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <ChefStoryModal isOpen={isChefStoryOpen} onClose={() => setIsChefStoryOpen(false)} />

        {cartDrawer}
        <ScrollToTop />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </>
    );
  }

  const heroSection = sections.find((s) => s.type === 'hero' && s.visible);
  const restSections = sections.filter((s) => s.type !== 'hero');
  const heroBackgroundMediaId = heroSection?.type === 'hero' ? heroSection.content?.backgroundMediaId : undefined;
  let galleryImages: ResolvedGalleryImage[] = [];
  try {
    galleryImages = resolveGalleryImages(sections, mediaMap);
  } catch {
    // An invalid CMS gallery must not prevent the rest of the public site from rendering.
    galleryImages = [];
  }
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans antialiased">
      <Header
        currentPage="landing"
        onNavigateLanding={() => setCurrentPage('landing')}
        onNavigateMenu={() => setCurrentPage('menu')}
        onNavigateReservations={() => setCurrentPage('reservations')}
        onNavigateItems={() => setCurrentPage('items')}
        onNavigateMembership={() => setCurrentPage('membership')}
        onToast={triggerToast}
        cartUniqueCount={cartUniqueCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="pt-0 flex-1">
        {heroSection?.type === 'hero' && (
          <div data-section="hero">
            <HeroSection
              variant={getSectionVariant('hero')}
              content={heroSection.content}
              backgroundImageUrl={
                heroBackgroundMediaId ? mediaMap.get(heroBackgroundMediaId)?.fileUrl : undefined
              }
              onNavigate={navigateFromLink}
            />
          </div>
        )}

        <LandingChrome
          vertical={vertical}
          address={brand?.contact?.address}
          businessHours={brand?.businessHours ?? []}
          isStickyShadowed={isStickyShadowed}
          onPrimaryAction={() => setCurrentPage(browsePage)}
          onSecondaryAction={() => setCurrentPage('reservations')}
        />

        <SectionRenderer
          sections={restSections}
          brand={brand}
          mediaMap={mediaMap}
          items={items}
          offers={offers}
          onNavigate={navigateFromLink}
          onAboutImageClick={() => setIsChefStoryOpen(true)}
          onGalleryImageClick={(idx) => setLightboxIndex(idx)}
          onViewMenu={() => setCurrentPage(browsePage)}
          onOfferClick={() => setCurrentPage(offerPage)}
        />
      </main>

      <Footer
        onNavigateLanding={() => setCurrentPage('landing')}
        onNavigateMenu={() => setCurrentPage('menu')}
        onNavigateReservations={() => setCurrentPage('reservations')}
        onToast={triggerToast}
      />

      {cartDrawer}

      <GalleryLightbox
        isOpen={lightboxIndex !== null}
        images={galleryImages}
        currentIndex={lightboxIndex || 0}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      <ChefStoryModal isOpen={isChefStoryOpen} onClose={() => setIsChefStoryOpen(false)} />

      <ScrollToTop />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}

function ThemedShell() {
  const { brand } = usePublicData();
  return (
    <ThemeProvider brand={brand}>
      <AppShell />
    </ThemeProvider>
  );
}

function App() {
  return (
    <PublicRestaurantProvider>
      <PublicDataProvider>
        <ThemedShell />
      </PublicDataProvider>
    </PublicRestaurantProvider>
  );
}

export default App;
