import { useState } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Radar, Phone, Globe, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useApp } from '@/context/AppContext';
import { HOTLINE } from '@/constants/countries';
import { HelpLovedOneDialog } from '@/components/HelpLovedOneDialog';

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'FR', label: 'Français' },
  { code: 'ES', label: 'Español' },
  { code: 'RU', label: 'Русский' },
  { code: 'AR', label: 'العربية' },
] as const;

export function Header() {
  const { user, logout } = useApp();
  const [lang, setLang] = useState<typeof LANGUAGES[number]['code']>('EN');

  return (
    <header className="sticky top-0 z-[1000] border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: Brand */}
        <RouterNavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-gradient-signal shadow-glow">
            <Radar className="h-4 w-4 text-primary-foreground radar-sweep" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight uppercase">Rumor Radar</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              Global
            </span>
          </div>
        </RouterNavLink>

        {/* Center: Hotline + Help a loved one */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-center max-w-2xl">
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Verification hotline
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">{HOTLINE.display}</span>
                <a href={`tel:${HOTLINE.tel}`}>
                  <Button size="sm" variant="default" className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider">
                    Call
                  </Button>
                </a>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Call to verify if a rumor is true or false
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-border/60" />

          <HelpLovedOneDialog />
        </div>

        {/* Right: Lang + Auth */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="gap-1.5 font-mono uppercase tracking-wider text-xs" disabled title="Multi-language coming soon">
            <Globe className="h-3.5 w-3.5" /> EN
          </Button>
          {user ? (
            <>
              <RouterNavLink to="/dashboard">
                <Button size="sm" variant="default" className="gap-1.5 font-mono uppercase tracking-wider text-xs">
                  <UserIcon className="h-3.5 w-3.5" />
                  {user.role === 'moderator' ? 'Console' : 'CSO'}
                </Button>
              </RouterNavLink>
              <Button size="icon" variant="ghost" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <RouterNavLink to="/login">
              <Button size="sm" variant="outline" className="gap-1.5 font-mono uppercase tracking-wider text-xs">
                <UserIcon className="h-3.5 w-3.5" /> Login
              </Button>
            </RouterNavLink>
          )}
        </div>
      </div>

      {/* Mobile hotline strip */}
      <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-bold truncate">{HOTLINE.display}</span>
          <a href={`tel:${HOTLINE.tel}`}>
            <Button size="sm" className="h-6 px-2 text-[10px] font-mono uppercase">Call</Button>
          </a>
        </div>
        <HelpLovedOneDialog />
      </div>
    </header>
  );
}
