import { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, MapPin } from 'lucide-react';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../../hooks/api/useUsers';
import { useSites } from '../../hooks/api/useSites';
import { useAdminToast } from '../../context/AdminToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useRestaurant } from '../../../context/RestaurantContext';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusPill } from '../../components/StatusPill';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/forms/Field';
import type { User } from '../../../types';

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { user: currentUser } = useAuth();
  const { organizationId, restaurantId } = useRestaurant();
  const { data: allSites } = useSites(organizationId);
  // Suspended outlets can't be granted (the API rejects them), so they're left out of every access list.
  const sites = allSites?.filter((site) => site.status !== 'suspended');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { showToast } = useAdminToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  // Multi-Vertical Platform Plan §5.1: this screen only ever creates Staff - Owner accounts are created
  // exclusively by the platform team when the Organization itself is provisioned (§6B).
  const [form, setForm] = useState({ name: '', email: '', role: 'staff' as const, siteAccess: [restaurantId] });
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [editingAccess, setEditingAccess] = useState<{ user: User; siteAccess: string[] } | null>(null);

  useEffect(() => {
    if (isFormOpen) setForm((f) => ({ ...f, siteAccess: [restaurantId] }));
  }, [isFormOpen, restaurantId]);

  const toggleSiteAccess = (siteId: string) => {
    setForm((f) => ({
      ...f,
      siteAccess: f.siteAccess.includes(siteId) ? f.siteAccess.filter((id) => id !== siteId) : [...f.siteAccess, siteId],
    }));
  };

  const openAccess = (u: User) => {
    const granted = u.siteAccess === 'all' ? (sites ?? []).map((site) => site.id) : u.siteAccess ?? [];
    setEditingAccess({ user: u, siteAccess: granted.filter((id) => sites?.some((site) => site.id === id)) });
  };

  const handleSaveAccess = async () => {
    if (!editingAccess || editingAccess.siteAccess.length === 0) return;
    try {
      await updateUser.mutateAsync({ userId: editingAccess.user.id, payload: { siteAccess: editingAccess.siteAccess } });
      showToast('Location access updated.');
      setEditingAccess(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update access.', 'error');
    }
  };

  const siteNames = (u: User) => {
    if (u.siteAccess === 'all') return 'All locations';
    const names = (sites ?? []).filter((site) => u.siteAccess?.includes(site.id)).map((site) => site.name);
    return names.length ? names.join(', ') : 'No active locations';
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.siteAccess.length === 0) return;
    await createUser.mutateAsync(form);
    showToast('User invited.');
    setIsFormOpen(false);
    setForm({ name: '', email: '', role: 'staff', siteAccess: [restaurantId] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Users"
        description="Staff accounts with admin panel access. New Organizations and their Owner account are created by the platform team."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setIsFormOpen(true)}>
            Invite User
          </Button>
        }
      />

      <DataTable
        rows={users ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        emptyMessage="No additional users yet."
        columns={[
          {
            header: 'Name',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {u.name?.[0] ?? '?'}
                </div>
                <span className="font-semibold text-on-surface">{u.name}</span>
                {u.id === currentUser?.id && <span className="text-xs text-secondary">(you)</span>}
              </div>
            ),
          },
          { header: 'Email', render: (u) => <span className="text-secondary">{u.email}</span> },
          { header: 'Role', render: (u) => <StatusPill label={u.role.replace('_', ' ')} tone={u.role === 'owner' ? 'positive' : 'neutral'} /> },
          ...(sites && sites.length > 1
            ? [{ header: 'Locations', render: (u: User) => <span className="text-secondary">{siteNames(u)}</span> }]
            : []),
          {
            header: '',
            className: 'text-right',
            render: (u) => (
              <div className="flex items-center justify-end gap-1">
                {u.role === 'staff' && sites && sites.length > 1 && (
                  <button
                    onClick={() => openAccess(u)}
                    className="p-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface transition-colors"
                    aria-label="Edit location access"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setPendingDelete(u)}
                  disabled={u.id === currentUser?.id}
                  className="p-2 rounded-lg text-secondary hover:bg-error-container/40 hover:text-error transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Remove user"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Invite User"
        description="They'll receive access to the admin panel with the selected role."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm text-secondary">
            Role: <span className="font-semibold text-on-surface">Staff</span>
          </div>

          {sites && sites.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Location access</label>
              <div className="space-y-1.5">
                {sites.map((site) => (
                  <label key={site.id} className="flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={form.siteAccess.includes(site.id)}
                      onChange={() => toggleSiteAccess(site.id)}
                      className="rounded border-outline-variant/50"
                    />
                    {site.name}
                  </label>
                ))}
              </div>
              {form.siteAccess.length === 0 && (
                <p className="text-xs text-error mt-1">Pick at least one location.</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editingAccess)}
        onClose={() => setEditingAccess(null)}
        title="Location access"
        description={editingAccess ? `Which locations ${editingAccess.user.name} can manage.` : undefined}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingAccess(null)}>Cancel</Button>
            <Button variant="primary" loading={updateUser.isPending} disabled={!editingAccess?.siteAccess.length} onClick={handleSaveAccess}>
              Save
            </Button>
          </>
        }
      >
        {editingAccess && (
          <div className="space-y-1.5">
            {(sites ?? []).map((site) => (
              <label key={site.id} className="flex items-center gap-2 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={editingAccess.siteAccess.includes(site.id)}
                  onChange={() =>
                    setEditingAccess({
                      ...editingAccess,
                      siteAccess: editingAccess.siteAccess.includes(site.id)
                        ? editingAccess.siteAccess.filter((id) => id !== site.id)
                        : [...editingAccess.siteAccess, site.id],
                    })
                  }
                  className="rounded border-outline-variant/50"
                />
                {site.name}
              </label>
            ))}
            {editingAccess.siteAccess.length === 0 && <p className="text-xs text-error mt-1">Pick at least one location.</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Remove user?"
        description={`"${pendingDelete?.name}" will lose access to the admin panel.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await deleteUser.mutateAsync(pendingDelete.id);
            showToast('User removed.');
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
