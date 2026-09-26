import { useTranslation } from 'react-i18next';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Phone, User as UserIcon, LogOut, Menu, Map, Clock, Users, BarChart3, LayoutDashboard, Info, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { HOTLINE } from '@/constants/countries';
import { CallExplainerDialog } from '@/components/CallExplainerDialog';
import { SubscribeDialog } from '@/components/SubscribeDialog';
import { cn } from '@/lib/utils';

const menuLinks: { to: string; key: string; icon: typeof Map; end?: boolean }[] = [
  { to: '/', key: 'heatmap', icon: Map, end: true },
  { to: '/timeline', key: 'timeline', icon: Clock },
  { to: '/csos', key: 'csos', icon: Users },
  { to: '/impact', key: 'impact', icon: BarChart3 },
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/about', key: 'about', icon: Info },
];

export function Header() {
  const { user, signOut, isStaff } = useAuth();
  const { t } = useTranslation();
  const [callOpen, setCallOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: Brand */}
        <RouterNavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight uppercase">{t('brand.name')}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              {t('brand.tagline')}
            </span>
          </div>
        </RouterNavLink>

        {/* Center: Hotline + Help a loved one */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-center max-w-2xl">
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {t('header.hotlineLabel')}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">{HOTLINE.display}</span>
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider"
                  onClick={() => setCallOpen(true)}
                >
                  {t('header.call')}
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {t('header.hotlineHelp')}
              </span>
            </div>
          </div>

        </div>

        {/* Right: My profile + menu */}
        <div className="flex items-center gap-2 shrink-0">
          <RouterNavLink to={user ? '/dashboard' : '/login'}>
            <Button size="sm" variant={user ? 'default' : 'outline'} className="gap-1.5 font-mono uppercase tracking-wider text-xs h-10">
              <UserIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{user ? 'My profile' : t('header.login')}</span>
            </Button>
          </RouterNavLink>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Menu" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] flex flex-col">
              <SheetHeader>
                <SheetTitle className="font-mono uppercase tracking-[0.2em] text-xs text-muted-foreground">
                  {t('brand.name')}
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-4 flex flex-col gap-1">
                {menuLinks.map((l) => (
                  <RouterNavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 h-11 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                      )
                    }
                  >
                    <l.icon className="h-4 w-4" />
                    {t(`nav.${l.key}`)}
                  </RouterNavLink>
                ))}

                {isStaff && (
                  <RouterNavLink
                    to="/staff/cso-review"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 h-11 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                      )
                    }
                  >
                    <Users className="h-4 w-4" /> Review
                  </RouterNavLink>
                )}

              </nav>

              <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    setSubscribeOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4" /> {t('nav.subscribe')}
                </Button>
                {user && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" /> {t('header.logOut')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile hotline strip — one centered row, never wraps; number hides on very narrow phones */}
      <div className="md:hidden flex items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap border-t border-border/40 px-2 py-2 text-xs">
        <button
          type="button"
          onClick={() => setCallOpen(true)}
          aria-label="Call the hotline"
          className="shrink-0 cursor-pointer"
        >
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="hidden shrink-0 font-bold min-[380px]:inline">
          {HOTLINE.display}
        </span>
        <Button
          size="sm"
          className="h-6 shrink-0 px-2 text-[10px] font-mono uppercase"
          onClick={() => setCallOpen(true)}
        >
          {t('header.call')}
        </Button>
      </div>
      <CallExplainerDialog open={callOpen} onOpenChange={setCallOpen} />
      <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />
    </header>
  );
}
