import { useCallback, useEffect, useState } from 'react';
import { AlignCenter, AlignRight, Info, Palette, Type } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBrandDraft, useUpdateBrand } from '../../../../hooks/api/useWebsite';
import { useMedia } from '../../../../hooks/api/useMedia';
import { useAutoSave } from '../../../../hooks/useAutoSave';
import { SectionCard } from '../../../../components/SectionCard';
import { FormSkeleton } from '../../../../components/Skeleton';
import { TextField, SelectField } from '../../../../components/forms/Field';
import { ToggleField } from '../../../../components/forms/ToggleField';
import { ImagePickerField } from '../../../../components/forms/ImagePickerField';
import { HexColorField } from '../../../../components/forms/HexColorField';
import { ColorTokenSelect } from '../../../../components/forms/ColorTokenSelect';
import { FontSelect } from '../../../../components/forms/FontSelect';
import { useReportAutoSave, type PanelCallbacks } from './panelTypes';
import { PanelLoadError } from './PanelLoadError';
import { FONT_WEIGHTS, type BrandSettings, type FontWeight, type NavPosition } from '../../../../../types';

const NAV_POSITION_OPTIONS: { value: NavPosition; label: string; icon: typeof AlignRight }[] = [
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'center', label: 'Center', icon: AlignCenter },
];

/**
 * Brand settings, split by where owners look for them: `header` (logo, name, nav, header colors) under
 * Header & Footer, and `style` (theme + fonts) under Colors & Fonts. One draft, auto-saved.
 */
export function BrandPanel({ mode, ...callbacks }: { mode: 'header' | 'style' } & PanelCallbacks) {
  const { data: brand, isError, isFetching, refetch } = useBrandDraft();
  const updateBrand = useUpdateBrand();
  const { data: media } = useMedia();
  const [draft, setDraft] = useState<BrandSettings | null>(null);

  useEffect(() => {
    if (brand) setDraft((prev) => prev ?? brand);
  }, [brand]);

  const isDirty = Boolean(draft && brand && JSON.stringify(draft) !== JSON.stringify(brand));
  const persist = useCallback(async () => {
    if (draft) await updateBrand.mutateAsync(draft);
  }, [draft, updateBrand]);
  const { status } = useAutoSave({ isDirty, value: draft, onSave: persist, enabled: Boolean(draft) });
  useReportAutoSave(status, callbacks);

  if (!draft) return isError ? <PanelLoadError onRetry={() => void refetch()} isRetrying={isFetching} /> : <FormSkeleton />;
  const set = (patch: Partial<BrandSettings>) => setDraft({ ...draft, ...patch });

  if (mode === 'header') {
    const logoUrl = media?.items.find((m) => m.id === draft.logoMediaId)?.fileUrl;
    const faviconUrl = media?.items.find((m) => m.id === draft.faviconMediaId)?.fileUrl;
    return (
      <div className="space-y-5">
        <SectionCard title="Logo & name">
          <div className="space-y-5">
            <ImagePickerField label="Logo" currentImageUrl={logoUrl} onSelect={(asset) => set({ logoMediaId: asset.id })} onRemove={() => set({ logoMediaId: null })} />
            <div>
              <ImagePickerField label="Browser tab icon" currentImageUrl={faviconUrl} onSelect={(asset) => set({ faviconMediaId: asset.id })} onRemove={() => set({ faviconMediaId: null })} />
              <p className="text-xs text-secondary mt-1.5">Optional square image shown in the browser tab next to your business name. Uses your logo if left empty.</p>
            </div>
            <TextField label="Business name" maxLength={100} value={draft.restaurantName} onChange={(e) => set({ restaurantName: e.target.value })} />
          </div>
        </SectionCard>

        <SectionCard title="Menu position" description="Where the page links sit in the header.">
          <div className="flex gap-2">
            {NAV_POSITION_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => set({ navPosition: value })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  (draft.navPosition ?? 'right') === value ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cart" description="Control whether the cart icon can appear in the header.">
          <ToggleField
            label="Show cart in header"
            description="Turn off to hide the cart icon everywhere on your site, even when it has items."
            checked={draft.showCart ?? true}
            onChange={(showCart) => set({ showCart })}
          />
        </SectionCard>

        <SectionCard title="Header colors" description="Override the header's background and link colors. Leave as default to follow your theme.">
          <div className="space-y-5">
            <HexColorField label="Background" defaultColor="#fbf9f9" value={draft.headerBackgroundColor} onChange={(headerBackgroundColor) => set({ headerBackgroundColor })} />
            <HexColorField label="Link text" defaultColor="#5f5e5e" value={draft.headerTextColor} onChange={(headerTextColor) => set({ headerTextColor })} />
            <HexColorField label="Link text on hover" defaultColor="#1b1c1c" value={draft.headerTextHoverColor} onChange={(headerTextHoverColor) => set({ headerTextHoverColor })} />
          </div>
        </SectionCard>

        <p className="text-xs text-secondary px-1">
          Page names in the menu are set per page (Settings tab). Footer text and links are on the <strong>Text &amp; images</strong> tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Color theme" icon={Palette} description="Used for buttons, links and accents across your whole site.">
        <ColorTokenSelect themePresetId={draft.themePresetId} customPrimaryColor={draft.customPrimaryColor} onChange={(value) => set(value)} />
      </SectionCard>

      <SectionCard title="Typography" icon={Type}>
        <div className="space-y-4">
          <FontSelect label="Body font (text, menu, buttons)" value={draft.primaryFont} onChange={(primaryFont) => set({ primaryFont })} />
          <FontSelect label="Heading font" value={draft.headingFont} onChange={(headingFont) => set({ headingFont })} />
          <SelectField label="Font weight" value={draft.fontWeight} onChange={(e) => set({ fontWeight: e.target.value as FontWeight })}>
            {FONT_WEIGHTS.map((w) => (
              <option key={w} value={w} className="capitalize">
                {w}
              </option>
            ))}
          </SelectField>
        </div>
      </SectionCard>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 p-4">
        <Info className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-secondary">
          Contact details, opening hours and social links live under <Link to="/admin/restaurant/information" className="font-semibold text-primary hover:underline">Restaurant → Information</Link> in the sidebar.
        </p>
      </div>
    </div>
  );
}
