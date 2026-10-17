import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, MapPin, Pencil, Plus } from 'lucide-react';
import { useCreateSite, useUpdateSite } from '../../hooks/api/useSites';
import { useAdminToast } from '../../context/AdminToastContext';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DataTable } from '../../components/DataTable';
import { StatusPill } from '../../components/StatusPill';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { SelectField, TextField } from '../../components/forms/Field';
import { LocationFinder, type PickedLocation } from '../../components/LocationFinder';
import { formatSiteAddress } from '../../../services/sites';
import { getReserveSettings } from '../../../services/reserve';
import { VERTICALS, type Restaurant, type SiteAddress } from '../../../types';

const EMPTY_ADDRESS: SiteAddress = { line1: '', line2: '', city: '', region: '', postalCode: '', country: '' };

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

interface LocationForm {
  name: string;
  slug: string;
  slugEdited: boolean;
  address: SiteAddress;
  location: PickedLocation | null;
  /** Only a moved/re-picked location is sent when editing, so an untouched one is never overwritten. */
  locationChanged: boolean;
  copyFromId: string;
  copyBranding: boolean;
  copyMenu: boolean;
  copyReservations: boolean;
}

/** Owner only - the outlets (Sites) of this Organization: add one (optionally copied from another), edit its address, suspend or reactivate it. */
export function LocationsPage() {
  const { organizationId, restaurantId, sites, setActiveSiteId } = useRestaurant();
  const createSite = useCreateSite(organizationId);
  const updateSite = useUpdateSite(organizationId);
  const { showToast } = useAdminToast();

  const [editing, setEditing] = useState<Restaurant | 'new' | null>(null);
  const [form, setForm] = useState<LocationForm | null>(null);
  const activeSites = sites.filter((s) => s.status !== 'suspended');
  // All outlets of an Organization are the same kind of business; a new one inherits it.
  const businessType = sites.find((s) => VERTICALS.includes(s.vertical))?.vertical ?? 'restaurant';
  const editingSiteId = editing && editing !== 'new' ? editing.id : null;
  const { data: editingReserve } = useQuery({
    queryKey: ['reserve-settings', editingSiteId],
    queryFn: () => getReserveSettings(editingSiteId as string),
    enabled: Boolean(editingSiteId),
    retry: false,
  });
  // A new outlet's map opens on the outlet being edited, as the business is usually nearby.
  const { data: activeReserve } = useQuery({
    queryKey: ['reserve-settings', restaurantId],
    queryFn: () => getReserveSettings(restaurantId),
    enabled: editing === 'new' && Boolean(restaurantId),
    retry: false,
  });
  const mapCenter = activeReserve?.location?.latitude != null ? activeReserve.location : null;

  useEffect(() => {
    const saved = editingReserve?.location;
    if (!saved || saved.latitude == null) return;
    setForm((f) =>
      f && !f.locationChanged
        ? { ...f, location: { latitude: saved.latitude, longitude: saved.longitude, source: saved.source, googlePlaceId: editingReserve.google_place_id } }
        : f,
    );
  }, [editingReserve]);

  const openCreate = () => {
    const current = sites.find((s) => s.id === restaurantId);
    setForm({
      name: '',
      slug: '',
      slugEdited: false,
      address: EMPTY_ADDRESS,
      location: null,
      locationChanged: false,
      copyFromId: current?.id ?? '',
      copyBranding: true,
      copyMenu: true,
      copyReservations: true,
    });
    setEditing('new');
  };

  const openEdit = (site: Restaurant) => {
    setForm({
      name: site.name,
      slug: site.slug,
      slugEdited: true,
      address: { ...EMPTY_ADDRESS, ...site.address },
      location: null,
      locationChanged: false,
      copyFromId: '',
      copyBranding: false,
      copyMenu: false,
      copyReservations: false,
    });
    setEditing(site);
  };

  const close = () => {
    setEditing(null);
    setForm(null);
  };

  const setAddress = (field: keyof SiteAddress, value: string) =>
    setForm((f) => (f ? { ...f, address: { ...f.address, [field]: value } } : f));

  const hasAddress = (address: SiteAddress) => Object.values(address).some((v) => v?.trim());

  const pickLocation = (location: PickedLocation, address?: SiteAddress) =>
    setForm((f) => (f ? { ...f, location, locationChanged: true, address: address ? { ...EMPTY_ADDRESS, ...address } : f.address } : f));

  // The address at a hand-placed pin only fills fields the owner hasn't typed yet.
  const fillEmptyAddress = (found: SiteAddress) =>
    setForm((f) => {
      if (!f) return f;
      const merged = { ...f.address };
      for (const key of Object.keys(found) as Array<keyof SiteAddress>) {
        if (!merged[key]?.trim() && found[key]) merged[key] = found[key] as string;
      }
      return { ...f, address: merged };
    });

  const locationPayload = (location: PickedLocation) => ({
    location: { latitude: location.latitude, longitude: location.longitude, source: location.source },
    googlePlaceId: location.googlePlaceId,
  });

  const save = async () => {
    if (!form || !form.name.trim() || (editing === 'new' && !form.location)) return;
    const address = hasAddress(form.address) ? form.address : null;
    try {
      if (editing === 'new') {
        const copy = form.copyFromId && (form.copyBranding || form.copyMenu || form.copyReservations);
        const site = await createSite.mutateAsync({
          name: form.name.trim(),
          slug: form.slug,
          vertical: businessType,
          address,
          ...locationPayload(form.location as PickedLocation),
          copyFrom: copy
            ? { siteId: form.copyFromId, branding: form.copyBranding, menu: form.copyMenu, reservations: form.copyReservations }
            : undefined,
        });
        setActiveSiteId(site.id);
        showToast(`${site.name} added. You're now editing it - publish its website when it's ready for guests.`);
      } else if (editing) {
        await updateSite.mutateAsync({
          siteId: editing.id,
          name: form.name.trim(),
          address,
          ...(form.locationChanged && form.location ? locationPayload(form.location) : {}),
        });
        showToast('Location updated.');
      }
      close();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save the location.', 'error');
    }
  };

  const setStatus = async (site: Restaurant, status: Restaurant['status']) => {
    try {
      await updateSite.mutateAsync({ siteId: site.id, status });
      showToast(status === 'suspended' ? `${site.name} suspended - guests can no longer book or order there.` : `${site.name} reactivated.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not change the location status.', 'error');
    }
  };

  const copying = editing === 'new' && Boolean(form?.copyFromId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapPin}
        title="Locations"
        description="Each outlet has its own address, website, menu, reservations and orders. Guests switch between outlets from the header of your website or its Locations page."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            Add location
          </Button>
        }
      />

      <DataTable
        rows={sites}
        rowKey={(s) => s.id}
        emptyMessage="No locations yet."
        columns={[
          {
            header: 'Location',
            render: (s) => (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-on-surface">{s.name}</span>
                {s.id === restaurantId && <span className="text-xs text-secondary">(editing)</span>}
              </div>
            ),
          },
          {
            header: 'Address',
            render: (s) => <span className="text-secondary">{formatSiteAddress(s.address) || 'No address yet'}</span>,
          },
          {
            header: 'Status',
            render: (s) => <StatusPill label={s.status} tone={s.status === 'suspended' ? 'warning' : 'positive'} />,
          },
          {
            header: 'Public page',
            render: (s) => (
              <a href={`/s/${s.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:text-on-surface">
                /s/{s.slug}
                <ExternalLink className="h-3 w-3" />
              </a>
            ),
          },
          {
            header: '',
            className: 'text-right',
            render: (s) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(s)}>
                  Edit
                </Button>
                {s.status === 'suspended' ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus(s, 'active')}>
                    Reactivate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled={activeSites.length <= 1} onClick={() => setStatus(s, 'suspended')}>
                    Suspend
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={Boolean(editing && form)}
        onClose={close}
        title={editing === 'new' ? 'Add location' : 'Edit location'}
        description={editing === 'new' ? 'A new outlet gets its own website, booking page and online ordering.' : undefined}
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              variant="primary"
              loading={createSite.isPending || updateSite.isPending}
              disabled={!form?.name.trim() || (editing === 'new' && (!form?.slug || !form?.location))}
              onClick={save}
            >
              {editing === 'new' ? 'Add location' : 'Save'}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-5">
            <div className="space-y-3">
              <TextField
                label="Location name"
                required
                placeholder="e.g. Lumière Covent Garden"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: form.slugEdited ? form.slug : slugify(name) });
                }}
              />
              {editing === 'new' && (
                <>
                  <TextField
                    label="Web address"
                    required
                    hint={form.slug ? `Guests book and order at /s/${form.slug}` : 'Lowercase letters, numbers and hyphens only.'}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value), slugEdited: true })}
                  />
                  <div className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm text-secondary">
                    Business type: <span className="font-semibold capitalize text-on-surface">{businessType}</span>
                    <span className="block text-xs mt-0.5">Every location of your organization is the same type of business.</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 border-t border-outline-variant/20 pt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Map location</h4>
              <LocationFinder
                location={form.location}
                onPick={pickLocation}
                onAddressAtPin={fillEmptyAddress}
                initialCenter={mapCenter}
                required={editing === 'new'}
              />
            </div>

            <div className="space-y-3 border-t border-outline-variant/20 pt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Address</h4>
              <TextField label="Street address" value={form.address.line1} onChange={(e) => setAddress('line1', e.target.value)} />
              <TextField label="Address line 2" value={form.address.line2 ?? ''} onChange={(e) => setAddress('line2', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="City" value={form.address.city} onChange={(e) => setAddress('city', e.target.value)} />
                <TextField label="Postcode" value={form.address.postalCode} onChange={(e) => setAddress('postalCode', e.target.value)} />
                <TextField label="Region" value={form.address.region ?? ''} onChange={(e) => setAddress('region', e.target.value)} />
                <TextField label="Country" value={form.address.country} onChange={(e) => setAddress('country', e.target.value)} />
              </div>
            </div>

            {editing === 'new' && (
              <div className="space-y-3 border-t border-outline-variant/20 pt-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Setup</h4>
                <SelectField label="Start from" value={form.copyFromId} onChange={(e) => setForm({ ...form, copyFromId: e.target.value })}>
                  <option value="">A blank location</option>
                  {activeSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      A copy of {s.name}
                    </option>
                  ))}
                </SelectField>
                {copying && (
                  <div className="space-y-1.5 rounded-xl bg-surface-container-low px-3 py-2.5">
                    {(
                      [
                        ['copyBranding', 'Branding & website'],
                        ['copyMenu', 'Menu, add-ons & offers'],
                        ['copyReservations', 'Opening hours, seating & tables'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-on-surface">
                        <input
                          type="checkbox"
                          checked={form[key]}
                          onChange={() => setForm({ ...form, [key]: !form[key] })}
                          className="rounded border-outline-variant/50"
                        />
                        {label}
                      </label>
                    ))}
                    <p className="pt-1 text-xs text-secondary">The address, map location and bookings are never copied.</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-secondary">* Required</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
