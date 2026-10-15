import type { ContentPageDefinition } from '../../types';

export const globalContent: ContentPageDefinition = {
  key: 'global',
  label: 'Site-wide (header & footer)',
  description:
    'Text that appears on every page of your website: the top menu, the footer, the shopping cart and the pop-up windows.',
  previewHash: '#/',
  groups: [
    {
      id: 'header',
      title: 'Header',
      description: 'The menu bar at the top of every page.',
      fields: [
        {
          key: 'navHomeLabel',
          label: 'Home page link',
          type: 'text',
          hint: 'The menu link that takes visitors back to your home page. Also used in the footer.',
        },
      ],
    },
    {
      id: 'header-labels',
      title: 'Header - screen reader labels',
      advanced: true,
      fields: [
        { key: 'cartAriaLabel', label: 'Cart button (cart empty)', type: 'text', hint: 'Read aloud by screen readers.' },
        {
          key: 'cartAriaLabelWithCount',
          label: 'Cart button (items in cart)',
          type: 'text',
          hint: '{count} is replaced with the number of items in the cart.',
        },
        { key: 'mobileMenuAriaLabel', label: 'Mobile menu button', type: 'text', hint: 'Read aloud by screen readers.' },
      ],
    },
    {
      id: 'footer',
      title: 'Footer',
      description: 'The section at the bottom of every page.',
      fields: [
        {
          key: 'footerDescription',
          label: 'Short description',
          type: 'textarea',
          hint: 'Shown under your business name. Only used if you have not set a description in Brand settings. {city} is replaced with your area.',
        },
        { key: 'footerNavHeading', label: 'Navigation heading', type: 'text' },
        {
          key: 'footerExtraNavLabel',
          label: 'Extra menu link',
          type: 'text',
          hint: 'An additional link shown in the footer navigation list.',
        },
        { key: 'footerContactHeading', label: 'Contact heading', type: 'text' },
        {
          key: 'footerAddressFallback',
          label: 'Address (if not set in Brand settings)',
          type: 'text',
        },
        {
          key: 'footerPhoneFallback',
          label: 'Phone (if not set in Brand settings)',
          type: 'text',
        },
        {
          key: 'footerEmailFallback',
          label: 'Email (if not set in Brand settings)',
          type: 'text',
        },
        { key: 'poweredByLabel', label: '"Powered by" text', type: 'text', hint: 'Shown next to the platform badge, when the badge is enabled.' },
      ],
    },
    {
      id: 'footer-links',
      title: 'Footer links',
      description: 'The small links at the very bottom of the page, such as your privacy policy.',
      fields: [
        {
          key: 'legalLinks',
          label: 'Links',
          type: 'list',
          itemFields: [
            { key: 'label', label: 'Link text', type: 'text' },
            { key: 'url', label: 'Web address', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'footer-messages',
      title: 'Footer - messages',
      advanced: true,
      fields: [
        { key: 'shareToast', label: 'Message after tapping Share', type: 'text' },
        { key: 'instagramToast', label: 'Message after tapping Instagram', type: 'text' },
        { key: 'poweredByLogoAlt', label: 'Platform logo description', type: 'text', hint: 'Read aloud by screen readers.' },
      ],
    },
    {
      id: 'cart',
      title: 'Cart drawer',
      description: 'The panel that slides in when a visitor opens their cart.',
      fields: [
        { key: 'cartEyebrow', label: 'Small heading', type: 'text' },
        { key: 'cartEmptyTitle', label: 'Title when the cart is empty', type: 'text' },
        { key: 'cartCountSingular', label: 'Title with one item', type: 'text', hint: '{count} is replaced with the number of items.' },
        { key: 'cartCountPlural', label: 'Title with several items', type: 'text', hint: '{count} is replaced with the number of items.' },
        { key: 'cartEmptyHeading', label: 'Empty cart message', type: 'text' },
        { key: 'cartEmptyBody', label: 'Empty cart hint', type: 'text' },
        { key: 'cartAddonsHeading', label: 'Add-ons heading', type: 'text' },
        { key: 'cartSubtotalLabel', label: 'Subtotal label', type: 'text' },
        { key: 'cartCheckoutButton', label: 'Checkout button', type: 'text' },
      ],
    },
    {
      id: 'cart-labels',
      title: 'Cart drawer - small labels',
      advanced: true,
      fields: [
        { key: 'cartUnitPrice', label: 'Price per item', type: 'text', hint: '{price} is replaced with the price of one item.' },
        { key: 'cartRemoveItemTitle', label: 'Remove item tooltip', type: 'text' },
        { key: 'cartRemoveAddonTitle', label: 'Remove add-on tooltip', type: 'text' },
        { key: 'cartRemoveAriaLabel', label: 'Remove button (screen readers)', type: 'text', hint: '{name} is replaced with the item or add-on name.' },
        { key: 'cartDecreaseAriaLabel', label: 'Decrease button (screen readers)', type: 'text', hint: '{name} is replaced with the item name.' },
        { key: 'cartIncreaseAriaLabel', label: 'Increase button (screen readers)', type: 'text', hint: '{name} is replaced with the item name.' },
        { key: 'cartBackdropAriaLabel', label: 'Background close area (screen readers)', type: 'text' },
        { key: 'cartCloseAriaLabel', label: 'Close button (screen readers)', type: 'text' },
      ],
    },
    {
      id: 'item-options',
      title: 'Item options popup',
      description: 'The popup where visitors choose add-ons before adding an item to their cart.',
      fields: [
        { key: 'optionsChooseOne', label: 'Tag for "pick one" option groups', type: 'text' },
        { key: 'optionsOptional', label: 'Tag for optional option groups', type: 'text' },
        { key: 'optionsTotalLabel', label: 'Total label', type: 'text' },
        { key: 'optionsAddButton', label: 'Add to cart button', type: 'text' },
      ],
    },
    {
      id: 'item-options-labels',
      title: 'Item options popup - screen reader labels',
      advanced: true,
      fields: [
        { key: 'optionsBackdropAriaLabel', label: 'Background close area', type: 'text' },
        { key: 'optionsCloseAriaLabel', label: 'Close button', type: 'text' },
        { key: 'optionsDecreaseAriaLabel', label: 'Decrease quantity button', type: 'text' },
        { key: 'optionsIncreaseAriaLabel', label: 'Increase quantity button', type: 'text' },
      ],
    },
    {
      id: 'chef-story',
      title: 'Chef story popup',
      description: 'The popup that opens from the About section to tell your chef\'s story.',
      fields: [
        { key: 'chefEyebrow', label: 'Small heading', type: 'text' },
        { key: 'chefNameFallback', label: 'Name (if no chef name is set)', type: 'text' },
        { key: 'chefCloseButton', label: 'Close button', type: 'text' },
      ],
    },
    {
      id: 'chef-story-labels',
      title: 'Chef story popup - screen reader labels',
      advanced: true,
      fields: [{ key: 'chefCloseAriaLabel', label: 'Close (X) button', type: 'text' }],
    },
    {
      id: 'card-payment-form',
      title: 'Card payment form (checkout & deposits)',
      advanced: true,
      fields: [
        { key: 'cardLoading', label: 'Loading message', type: 'text' },
        { key: 'cardPayButton', label: 'Pay button', type: 'text', hint: '{amount} is replaced with the amount due.' },
        { key: 'cardInvalid', label: 'Card details rejected', type: 'text' },
        { key: 'cardNoToken', label: 'Card could not be verified', type: 'text' },
        { key: 'cardLoadError', label: 'Card form failed to load', type: 'text' },
        { key: 'cardNotConfigured', label: 'Card payments not set up', type: 'text' },
      ],
    },
    {
      id: 'locations',
      title: 'Locations',
      description: 'The location switcher in the header and the Locations page - shown only when your business has more than one location.',
      fields: [
        { key: 'locationSwitcherLabel', label: 'Header switcher heading', type: 'text' },
        { key: 'locationsViewAll', label: 'Switcher link to all locations', type: 'text' },
        { key: 'locationsTitle', label: 'Locations page heading', type: 'text' },
        { key: 'locationsIntro', label: 'Locations page introduction', type: 'textarea' },
        { key: 'locationsCurrent', label: 'Current location badge', type: 'text' },
        { key: 'locationsVisit', label: 'Visit button', type: 'text' },
        { key: 'locationsDirections', label: 'Directions link', type: 'text' },
      ],
    },
    {
      id: 'scroll-top',
      title: 'Back-to-top button',
      advanced: true,
      fields: [{ key: 'scrollTopLabel', label: 'Tooltip / screen reader label', type: 'text' }],
    },
  ],
  defaults: {
    // Locations
    locationSwitcherLabel: 'Change location',
    locationsViewAll: 'View all locations',
    locationsTitle: 'Our locations',
    locationsIntro: 'Book a table or order from the location nearest you.',
    locationsCurrent: 'You are here',
    locationsVisit: 'Visit',
    locationsDirections: 'Directions',
    // Header
    navHomeLabel: 'Discover',
    cartAriaLabel: 'Open cart',
    cartAriaLabelWithCount: 'Open cart, {count} items',
    mobileMenuAriaLabel: 'Toggle navigation menu',

    // Footer
    footerDescription:
      'Experience the invisible excellence of modern French cuisine in the heart of {city}. Part of the Haute-Cuisine Group.',
    footerNavHeading: 'Navigation',
    footerExtraNavLabel: 'Private Dining',
    footerContactHeading: 'Contact',
    footerAddressFallback: '12 Berkeley Square, Mayfair, London',
    footerPhoneFallback: '+44 (0) 20 7123 4567',
    footerEmailFallback: 'hello@lumiere-dining.com',
    poweredByLabel: 'POWERED BY',
    legalLinks: [
      { id: 'privacy', label: 'Privacy Policy', url: '#' },
      { id: 'terms', label: 'Terms of Service', url: '#' },
      { id: 'accessibility', label: 'Accessibility', url: '#' },
    ],
    shareToast: 'Share link copied',
    instagramToast: 'Instagram page opened',
    poweredByLogoAlt: 'Astryd Logo',

    // Cart drawer
    cartEyebrow: 'Your Cart',
    cartEmptyTitle: 'Empty',
    cartCountSingular: '{count} Item',
    cartCountPlural: '{count} Items',
    cartEmptyHeading: 'Your cart is empty',
    cartEmptyBody: 'Add dishes from the menu to get started.',
    cartAddonsHeading: 'Included add-ons',
    cartSubtotalLabel: 'Subtotal',
    cartCheckoutButton: 'Checkout',
    cartUnitPrice: '{price} each',
    cartRemoveItemTitle: 'Remove item',
    cartRemoveAddonTitle: 'Remove add-on',
    cartRemoveAriaLabel: 'Remove {name}',
    cartDecreaseAriaLabel: 'Decrease {name}',
    cartIncreaseAriaLabel: 'Increase {name}',
    cartBackdropAriaLabel: 'Close cart',
    cartCloseAriaLabel: 'Close cart drawer',

    // Item options popup
    optionsChooseOne: 'Choose one',
    optionsOptional: 'Optional',
    optionsTotalLabel: 'Total',
    optionsAddButton: 'Add to Cart',
    optionsBackdropAriaLabel: 'Close customize modal',
    optionsCloseAriaLabel: 'Close',
    optionsDecreaseAriaLabel: 'Decrease quantity',
    optionsIncreaseAriaLabel: 'Increase quantity',

    // Chef story popup
    chefEyebrow: 'Executive Chef',
    chefNameFallback: 'Our Chef',
    chefCloseButton: 'Close Story',
    chefCloseAriaLabel: 'Close',

    // Card payment form
    cardLoading: 'Loading secure card fields…',
    cardPayButton: 'Pay ${amount}',
    cardInvalid: 'Please check your card details and try again.',
    cardNoToken: 'Finix did not return a card token. Please try again.',
    cardLoadError: 'Unable to load secure card fields.',
    cardNotConfigured: 'Finix card payments are not configured.',

    // Back-to-top button
    scrollTopLabel: 'Scroll to top',
  },
  verticalDefaults: {
    restaurant: {
      footerExtraNavLabel: 'Private Dining',
      footerDescription:
        'Experience the invisible excellence of modern French cuisine in the heart of {city}. Part of the Haute-Cuisine Group.',
    },
    gym: {
      footerExtraNavLabel: 'Class Schedule',
      cartEmptyBody: 'Add a class or program to get started.',
      chefEyebrow: 'Head Coach',
      chefNameFallback: 'Our Coach',
      footerDescription:
        'A community-driven strength & conditioning gym - small-group programming, real coaching, no ego.',
    },
    retail: {
      footerExtraNavLabel: 'Gift Cards',
      cartEmptyBody: 'Add products from the shop to get started.',
      chefEyebrow: 'Our Founder',
      chefNameFallback: 'Our Founder',
      footerDescription: 'An independent lifestyle & home goods shop - small-batch makers, thoughtfully curated.',
    },
    salon: {
      navHomeLabel: 'Home',
      footerExtraNavLabel: 'Bridal & Events',
      cartEmptyBody: 'Add a service to get started.',
      chefEyebrow: 'Founder & Lead Stylist',
      chefNameFallback: 'Our Founder',
      footerDescription: 'A full-service Austin salon - expert cuts, color, nails and skin care, with easy online booking.',
      legalLinks: [
        { id: 'privacy', label: 'Privacy Policy', url: '#' },
        { id: 'terms', label: 'Terms of Service', url: '#' },
        { id: 'cancellation', label: 'Cancellation Policy', url: '#' },
        { id: 'accessibility', label: 'Accessibility', url: '#' },
      ],
    },
    coffee: {
      footerExtraNavLabel: 'Gift Cards',
      cartEmptyBody: 'Add a coffee or a pastry to get started.',
      chefEyebrow: 'Founder & Roaster',
      chefNameFallback: 'Our Founder',
      footerDescription: 'A small-batch coffee roaster and neighborhood cafe in {city} - order ahead, or stay a while.',
    },
    laundry: {
      footerExtraNavLabel: 'Same-Day Service',
      cartEmptyBody: 'Add a service to get started.',
      chefEyebrow: 'Founder',
      chefNameFallback: 'Our Founder',
      footerDescription: 'A family-owned laundry and dry cleaner in {city} - everything cleaned in-house, with free pickup and delivery.',
      legalLinks: [
        { id: 'privacy', label: 'Privacy Policy', url: '#' },
        { id: 'terms', label: 'Terms of Service', url: '#' },
        { id: 'care', label: 'Care & Claims Policy', url: '#' },
        { id: 'accessibility', label: 'Accessibility', url: '#' },
      ],
    },
  },
};
