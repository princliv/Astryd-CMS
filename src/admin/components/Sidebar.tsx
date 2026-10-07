import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PanelsTopLeft,
  Image,
  LayoutGrid,
  UtensilsCrossed,
  PlusCircle,
  Tag,
  Store,
  Phone,
  Clock,
  Share2,
  User,
  Users,
  X,
  PanelLeftClose,
  Eye,
  ChevronDown,
  Search,
  Settings,
  ShoppingBag,
  CalendarDays,
  ChevronsUpDown,
  Check,
  Building2,
  Crown,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useSidebar } from '../context/SidebarContext';
import { draftPreviewUrl, useDraftSave } from '../context/DraftSaveContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { usePageConfigs } from '../hooks/api/usePageConfigs';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from './Tooltip';
import { PreviewModal } from './PreviewModal';
import { BrandMark } from './BrandMark';

/** Multi-Vertical Platform Plan §10.2 - only appears once an Org has more than one Site; a single-Site Org sees the plain brand mark, unchanged. */
function SiteSwitcher() {
  const { restaurantId, sites, setActiveSiteId } = useRestaurant();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  if (sites.length <= 1) {
    return <BrandMark name={sites[0]?.name || 'Lumière'} />;
  }

  const activeSite = sites.find((s) => s.id === restaurantId) ?? sites[0];

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="-ml-1.5 flex w-full min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--astryd-hover)]"
      >
        <BrandMark name={activeSite.name} />
        <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 astryd-text-dim" />
      </button>

      {isOpen && (
        <div className="astryd-dropdown absolute left-0 top-full z-50 mt-1 w-64 py-1.5">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] astryd-text-dim">Sites</div>
          {sites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                setActiveSiteId(site.id);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] astryd-text-bright transition-colors hover:bg-[var(--astryd-hover)]"
            >
              <span className="flex-1 truncate">{site.name}</span>
              {site.id === activeSite.id && <Check className="h-4 w-4 shrink-0 astryd-text-cyan" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
  visible: boolean;
}

const COLLAPSED_STORAGE_KEY = 'admin_sidebar_collapsed';
const CLOSED_GROUPS_STORAGE_KEY = 'admin_sidebar_closed_groups';

function loadClosedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(CLOSED_GROUPS_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // Unreadable preference - start with every group open.
  }
  return new Set<string>();
}

function saveClosedGroups(groups: Set<string>) {
  try {
    localStorage.setItem(CLOSED_GROUPS_STORAGE_KEY, JSON.stringify([...groups]));
  } catch {
    // Preference just won't persist.
  }
}

function getInitials(name?: string) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Astryd's collapsible nav group: uppercase 10px label, right chevron, item-count pill while closed, animated height. */
function CollapsibleGroup({
  label,
  itemCount,
  hasActiveChild,
  isExpanded,
  onToggle,
  children,
}: {
  label: string;
  itemCount: number;
  hasActiveChild: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!innerRef.current) return;
    const observer = new ResizeObserver(([entry]) => setMeasuredHeight((entry.target as HTMLElement).offsetHeight));
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="mx-2 my-2 h-px bg-[var(--astryd-divider)]" />
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full select-none items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
          hasActiveChild ? 'astryd-text-bright' : 'astryd-text-dim hover:text-[var(--astryd-text-muted)]'
        }`}
      >
        <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</span>
        {!isExpanded && itemCount > 0 && (
          <span
            className={`min-w-[14px] rounded-full px-1 py-px text-center text-[8px] font-semibold leading-tight tabular-nums ${
              hasActiveChild ? 'bg-[rgba(0,196,205,0.12)] astryd-text-cyan' : 'bg-[var(--astryd-hover)] astryd-text-dim'
            }`}
          >
            {itemCount}
          </span>
        )}
        <ChevronDown className={`h-[10px] w-[10px] shrink-0 transition-transform duration-200 astryd-text-dim ${isExpanded ? '' : '-rotate-90'}`} />
      </button>
      <div className="astryd-nav-collapse" style={{ maxHeight: isExpanded ? (measuredHeight ?? 1000) : 0, opacity: isExpanded ? 1 : 0 }}>
        <div ref={innerRef} className="flex flex-col gap-0.5 pb-0.5 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const perms = usePermissions();
  const location = useLocation();
  const { restaurantId } = useRestaurant();
  const { mobileOpen, closeMobile, searchQuery, setSearchQuery } = useSidebar();
  const { flushDraft } = useDraftSave();
  const { user } = useAuth();
  const { sites } = useRestaurant();
  const [closedGroups, setClosedGroups] = useState<Set<string>>(loadClosedGroups);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = async () => {
    await flushDraft();
    setIsPreviewOpen(true);
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true');

  const { data: pageConfigs } = usePageConfigs();
  const catalogConfig = pageConfigs?.find((p) => p.module === 'catalog');
  const itemsConfig = pageConfigs?.find((p) => p.module === 'items');
  // The same items back both pages; name them after whichever page the Site actually shows (a Salon's "Services", not its switched-off "Shop").
  const catalogLabel = (catalogConfig?.enabled === false && itemsConfig?.enabled ? itemsConfig.navLabel : catalogConfig?.navLabel) || 'Menu';
  const bookingLabel = pageConfigs?.find((p) => p.module === 'booking')?.navLabel || 'Reservations';
  const membershipConfig = pageConfigs?.find((p) => p.module === 'membership');
  const membershipLabel = membershipConfig?.navLabel || 'Membership';

  // Super Admin isn't scoped to any one Organization/Site (Multi-Vertical Platform Plan §4/§5.1), so none of
  // the per-Site management screens below apply to it - it only ever sees the Platform area and its own
  // Account page, never a stray owner-style sidebar for whichever Site happens to be its fallback.
  const groups: NavGroup[] = useMemo(
    () =>
      perms.isSuperAdmin
        ? [
            {
              key: 'platform',
              title: 'Platform',
              visible: true,
              items: [{ to: '/admin/superadmin/sites', label: 'All Sites', icon: Building2, end: true }],
            },
            {
              key: 'settings',
              title: 'Settings',
              visible: true,
              items: [{ to: '/admin/settings/account', label: 'Account', icon: User }],
            },
          ]
        : [
            {
              key: 'main',
              title: '',
              visible: true,
              items: [
                { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
                { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
                { to: '/admin/reservations', label: bookingLabel, icon: CalendarDays },
                ...(membershipConfig?.enabled && perms.canManageMembership
                  ? [{ to: '/admin/membership', label: membershipLabel, icon: Crown }]
                  : []),
              ],
            },
            {
              key: 'website',
              title: 'Website',
              visible: perms.canManageWebsite,
              items: [
                // Every page, its sections, text, layout and settings, plus header/footer and theme, live in the Site Editor.
                { to: '/admin/website/pages', label: 'Site Editor', icon: PanelsTopLeft },
                { to: '/admin/website/media', label: 'Media Library', icon: Image },
              ],
            },
            {
              key: 'menu',
              title: catalogLabel,
              visible: perms.canManageMenu,
              items: [
                { to: '/admin/menu/categories', label: 'Categories', icon: LayoutGrid },
                { to: '/admin/menu/items', label: `${catalogLabel} Items`, icon: UtensilsCrossed },
                { to: '/admin/menu/addons', label: 'Add-ons', icon: PlusCircle },
                { to: '/admin/menu/offers', label: 'Offers', icon: Tag },
              ],
            },
            {
              key: 'restaurant',
              title: 'Business',
              visible: perms.canManageBranding,
              items: [
                { to: '/admin/restaurant/information', label: 'Information', icon: Store },
                { to: '/admin/restaurant/contact', label: 'Contact', icon: Phone },
                { to: '/admin/restaurant/hours', label: 'Opening Hours', icon: Clock },
                { to: '/admin/restaurant/social', label: 'Social Media', icon: Share2 },
              ],
            },
            {
              key: 'settings',
              title: 'Settings',
              visible: true,
              items: [
                { to: '/admin/settings/account', label: 'Account', icon: User },
                ...(perms.canManageSettings && import.meta.env.VITE_USE_MOCKS === 'true' ? [{ to: '/admin/settings/domains', label: 'Domains', icon: Globe }] : []),
                ...(perms.canManageUsers ? [{ to: '/admin/settings/users', label: 'Users', icon: Users }] : []),
              ],
            },
          ],
    [
      perms.isSuperAdmin,
      perms.canManageWebsite,
      perms.canManageMenu,
      perms.canManageBranding,
      perms.canManageUsers,
      perms.canManageSettings,
      perms.canManageMembership,
      catalogLabel,
      bookingLabel,
      membershipConfig?.enabled,
      membershipLabel,
    ]
  );

  const visibleGroups = useMemo(() => groups.filter((g) => g.visible), [groups]);

  const displayGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleGroups;
    return visibleGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [visibleGroups, searchQuery]);

  const isActive = useCallback(
    (item: NavItem) => (item.end ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(item.to + '/')),
    [location.pathname]
  );

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname, setSearchQuery]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCollapse]);

  const toggleGroup = useCallback((key: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveClosedGroups(next);
      return next;
    });
  }, []);

  // Navigating into a closed group re-opens it so the active page is never hidden.
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;
    const owner = visibleGroups.find((g) => g.items.some((item) => isActive(item)));
    if (!owner) return;
    setClosedGroups((prev) => {
      if (!prev.has(owner.key)) return prev;
      const next = new Set(prev);
      next.delete(owner.key);
      saveClosedGroups(next);
      return next;
    });
  }, [location.pathname, visibleGroups, isActive]);

  const renderItem = (item: NavItem, collapsed: boolean) => {
    const active = isActive(item);
    const Icon = item.icon;

    const link = (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={`group relative flex h-6 items-center gap-2 rounded-md text-[12px] leading-none transition-colors ${
          collapsed ? 'w-9 justify-center px-0' : 'px-2'
        } ${
          active
            ? 'bg-[rgba(0,196,205,0.08)] font-medium astryd-text-bright'
            : 'astryd-text-muted hover:bg-[var(--astryd-hover)] hover:text-[var(--astryd-text-bright)]'
        }`}
      >
        <Icon className={`h-[13px] w-[13px] shrink-0 ${active ? 'astryd-text-cyan' : 'astryd-text-muted'}`} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </NavLink>
    );

    return collapsed ? (
      <Tooltip key={item.to} label={item.label}>
        {link}
      </Tooltip>
    ) : (
      <div key={item.to}>{link}</div>
    );
  };

  const renderNav = (collapsed: boolean) => {
    const isSearching = searchQuery.trim().length > 0;
    return (
      <nav className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${collapsed ? 'items-center px-0 py-1.5' : 'px-2.5 py-1.5'}`}>
        {displayGroups.map((group, idx) => {
          const groupHasActive = group.items.some((item) => isActive(item));

          if (collapsed) {
            return (
              <div key={group.key}>
                {idx > 0 && <div className="mx-2 my-2 h-px bg-[var(--astryd-divider)]" />}
                <div className="flex flex-col items-center gap-0.5">{group.items.map((item) => renderItem(item, true))}</div>
              </div>
            );
          }

          // Untitled group (the main links) is always visible, no header.
          if (!group.title) {
            return (
              <div key={group.key} className="flex flex-col gap-0.5">
                {group.items.map((item) => renderItem(item, false))}
              </div>
            );
          }

          if (isSearching) {
            return (
              <div key={group.key}>
                <div className="mx-2 my-2 h-px bg-[var(--astryd-divider)]" />
                <div className="px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] astryd-text-dim">{group.title}</span>
                </div>
                <div className="flex flex-col gap-0.5">{group.items.map((item) => renderItem(item, false))}</div>
              </div>
            );
          }

          return (
            <CollapsibleGroup
              key={group.key}
              label={group.title}
              itemCount={group.items.length}
              hasActiveChild={groupHasActive}
              isExpanded={!closedGroups.has(group.key)}
              onToggle={() => toggleGroup(group.key)}
            >
              {group.items.map((item) => renderItem(item, false))}
            </CollapsibleGroup>
          );
        })}
      </nav>
    );
  };

  const effectiveCollapsed = mobileOpen ? false : isCollapsed;
  const userName = user?.name || 'Guest';
  const siteName = sites.find((s) => s.id === restaurantId)?.name ?? sites[0]?.name ?? '';
  const userSub = perms.isSuperAdmin ? 'Platform' : siteName || user?.role?.replace('_', ' ') || '';

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobile} aria-hidden="true" />}

      <aside
        className={`astryd-sidebar-bg fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col transition-[width,transform] duration-300 ease-in-out lg:relative lg:z-10 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:flex'
        }`}
        style={{ width: effectiveCollapsed ? 'var(--admin-sidebar-w-collapsed)' : 'var(--admin-sidebar-w)' }}
      >
        <div className={`flex h-14 shrink-0 items-center ${effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {effectiveCollapsed ? (
            <Tooltip label="Expand sidebar (Ctrl+B)">
              <button onClick={toggleCollapse} className="flex h-7 w-7 items-center justify-center rounded-md" aria-label="Expand sidebar">
                <BrandMark showName={false} size="sm" />
              </button>
            </Tooltip>
          ) : perms.isSuperAdmin ? (
            // Not scoped to any Site, so no Site name/switcher - just the platform brand mark.
            <BrandMark name="Platform" />
          ) : (
            <SiteSwitcher />
          )}

          {!effectiveCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden rounded-md p-1 astryd-text-muted transition-colors hover:text-[var(--astryd-text-bright)] lg:inline-flex"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-[14px] w-[14px]" />
            </button>
          )}

          {mobileOpen && (
            <button onClick={closeMobile} className="rounded-md p-1 astryd-text-muted hover:text-[var(--astryd-text-bright)] lg:hidden" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!effectiveCollapsed && (
          <div className="shrink-0 px-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 astryd-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search navigation"
                className="h-8 w-full rounded-lg border border-[var(--astryd-card-stroke)] bg-[var(--astryd-input-fill)] pl-8 pr-3 text-[12px] astryd-text-muted outline-none transition-colors placeholder:text-[var(--astryd-text-dim)] focus:border-[rgba(0,196,205,0.3)] focus:bg-[var(--astryd-hover)]"
              />
            </div>
          </div>
        )}

        {renderNav(effectiveCollapsed)}

        {!perms.isSuperAdmin && (
          <div className={`shrink-0 ${effectiveCollapsed ? 'flex justify-center px-2 pb-2' : 'px-3 pb-3'}`}>
            {effectiveCollapsed ? (
              <Tooltip label="Preview website">
                <button type="button" onClick={() => void handlePreview()} className="astryd-btn h-8 w-9 rounded-md" aria-label="Preview website">
                  <Eye className="h-[14px] w-[14px]" />
                </button>
              </Tooltip>
            ) : (
              <div className="astryd-card-cyan p-3">
                <div className="text-[12px] font-medium astryd-text-bright">Preview website</div>
                <p className="mt-1 text-[11px] leading-snug astryd-text-muted">Saves your latest edits, then shows the whole site right here.</p>
                <button type="button" onClick={() => void handlePreview()} className="astryd-btn mt-2.5 h-8 w-full gap-1.5 text-[12px]">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>
            )}
          </div>
        )}

        <div className="shrink-0 border-t" style={{ borderColor: 'rgba(143, 168, 200, 0.08)' }}>
          {effectiveCollapsed ? (
            <div className="flex flex-col items-center gap-1.5 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--astryd-cyan)] text-[10px] font-medium text-white">
                {getInitials(userName)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--astryd-cyan)] text-[11px] font-medium text-white">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] leading-tight astryd-text-bright">{userName}</div>
                <div className="truncate text-[10px] capitalize leading-tight astryd-text-muted">{userSub}</div>
              </div>
              <NavLink
                to="/admin/settings/account"
                className="rounded-md p-1.5 astryd-text-muted transition-colors hover:text-[var(--astryd-text-bright)]"
                aria-label="Account settings"
              >
                <Settings className="h-[14px] w-[14px]" />
              </NavLink>
            </div>
          )}
        </div>
      </aside>

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} url={draftPreviewUrl(restaurantId)} />
    </>
  );
}
