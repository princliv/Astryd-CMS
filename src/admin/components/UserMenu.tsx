import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getInitials(name?: string) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Astryd's navbar user control: a 28px cyan initials avatar that opens a name / role / Account / Sign out menu. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--astryd-cyan)] text-[10px] font-medium text-white"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {getInitials(user?.name)}
      </button>

      {open && (
        <div role="menu" className="astryd-dropdown absolute right-0 top-full z-50 mt-2 w-56 p-1">
          <div className="flex flex-col px-2 py-2">
            <span className="truncate text-xs font-semibold astryd-text-bright">{user?.name}</span>
            {user?.email && <span className="truncate text-[11px] astryd-text-muted">{user.email}</span>}
            <span className="mt-0.5 truncate text-[10px] uppercase tracking-wider astryd-text-muted">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="my-1 h-px bg-[var(--astryd-divider)]" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/admin/settings/account');
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs astryd-text-bright transition-colors hover:bg-[var(--astryd-hover)]"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Account
          </button>
          <div className="my-1 h-px bg-[var(--astryd-divider)]" />
          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-500 transition-colors hover:bg-[var(--astryd-hover)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
