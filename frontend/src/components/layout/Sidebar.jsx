import { NavLink } from 'react-router-dom';
import { BarChart3, Brain, FolderOpen, LayoutDashboard, Lightbulb, LogOut, Scale, Settings, Waypoints, X } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases', label: 'Cases', icon: FolderOpen },
  { to: '/predictions', label: 'AI Prediction', icon: Brain },
  { to: '/similar', label: 'Similar Cases', icon: Waypoints },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose, onLogout }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-950 text-ink-100 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-brass-500/15 p-2"><Scale className="h-5 w-5 text-brass-400" /></div>
            <div>
              <p className="font-serif text-lg font-semibold leading-tight text-white">NyayaAI</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400">Judicial Intelligence</p>
            </div>
          </div>
          <button type="button" className="rounded p-1 text-ink-300 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#cfa23f]' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon className="h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" /> Logout
          </button>
          <p className="px-3 pt-3 text-[10px] leading-relaxed text-ink-500">Academic research prototype. Decision-support only — not a legal authority.</p>
        </div>
      </aside>
    </>
  );
}
