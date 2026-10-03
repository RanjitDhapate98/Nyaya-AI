import { Link } from 'react-router-dom';
import { Menu, Plus, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenu }) {
  const { user, canEdit } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink-100 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 text-ink-600 hover:bg-ink-50 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <p className="hidden text-sm text-ink-500 sm:block">Case delay-risk decision support</p>
      </div>
      <div className="flex items-center gap-3">
        {canEdit && (
          <Link to="/cases/new" className="btn-accent px-3 py-1.5">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New case</span>
          </Link>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-ink-100 px-2.5 py-1.5">
          <UserCircle2 className="h-5 w-5 text-ink-400" />
          <div className="leading-tight">
            <p className="max-w-[140px] truncate text-sm font-medium text-ink-900">{user?.name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brass-600">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
