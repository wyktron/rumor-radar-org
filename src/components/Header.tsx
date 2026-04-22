import { NavLink as RouterNavLink } from 'react-router-dom';
import { Radar, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Heatmap', end: true },
  { to: '/timeline', label: 'Timeline' },
  { to: '/csos', label: 'CSO Network' },
  { to: '/impact', label: 'Impact' },
  { to: '/about', label: 'About' },
];

export function Header() {
  const { user, logout } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-4">
        <RouterNavLink to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-signal shadow-glow">
            <Radar className="h-4 w-4 text-primary-foreground radar-sweep" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight">Rumor Radar</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="ticker-blink inline-block">●</span> live ops
            </span>
          </div>
        </RouterNavLink>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <RouterNavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                )
              }
            >
              {l.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <RouterNavLink to="/submit">
            <Button size="sm" variant="outline" className="font-mono uppercase tracking-wider text-xs">
              Submit rumor
            </Button>
          </RouterNavLink>
          {user ? (
            <>
              <RouterNavLink to="/dashboard">
                <Button size="sm" className="gap-1.5 font-mono uppercase tracking-wider text-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.role === 'moderator' ? 'Mod console' : 'CSO console'}
                </Button>
              </RouterNavLink>
              <Button size="icon" variant="ghost" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <RouterNavLink to="/login">
              <Button size="sm" variant="ghost" className="font-mono uppercase tracking-wider text-xs">
                Log in
              </Button>
            </RouterNavLink>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-border/40 overflow-x-auto">
        <div className="flex gap-1 px-3 py-1.5">
          {links.map((l) => (
            <RouterNavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 text-xs rounded-md whitespace-nowrap',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                )
              }
            >
              {l.label}
            </RouterNavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
