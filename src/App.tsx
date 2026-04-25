import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { DonationDialog } from "@/components/DonationDialog";
import { WelcomeDialogs } from "@/components/WelcomeDialogs";
import { Map, Clock, Users, BarChart3, LayoutDashboard, Info, Mail, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Index from "./pages/Index.tsx";
import TimelinePage from "./pages/TimelinePage";
import CSONetworkPage from "./pages/CSONetworkPage";
import CSORegisterPage from "./pages/CSORegisterPage";
import SubmitRumorPage from "./pages/SubmitRumorPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ImpactPage from "./pages/ImpactPage";
import AboutPage from "./pages/AboutPage";
import CSOReviewPage from "./pages/CSOReviewPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const secondaryLinks: { to: string; key: string; icon: typeof Map; end?: boolean }[] = [
  { to: '/', key: 'heatmap', icon: Map, end: true },
  { to: '/timeline', key: 'timeline', icon: Clock },
  { to: '/csos', key: 'csos', icon: Users },
  { to: '/impact', key: 'impact', icon: BarChart3 },
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/about', key: 'about', icon: Info },
];

function SecondaryNav() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const { t } = useTranslation();
  const navRef = useRef<HTMLElement>(null);

  // Publish the nav's actual rendered height as a CSS var so any page
  // (especially the heatmap with floating panels) can position content
  // above it correctly across viewport sizes & wrapping states.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--bottom-nav-h', `${Math.ceil(h)}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <>
      <nav ref={navRef} className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/85 backdrop-blur-xl z-[1000]">

        <div className="flex flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:flex-nowrap sm:overflow-x-auto sm:justify-start">
            {secondaryLinks.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                end={l.end}
                aria-label={t(`nav.${l.key}`)}
                title={t(`nav.${l.key}`)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center gap-1.5 rounded-md whitespace-nowrap transition-colors',
                    'p-2 sm:px-3 sm:py-1.5 text-xs font-medium',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                  )
                }
              >
                <l.icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{t(`nav.${l.key}`)}</span>
              </RouterNavLink>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 shrink-0 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              aria-label={t('nav.subscribe')}
              title={t('nav.subscribe')}
              className="gap-1.5 text-xs h-8 px-2 sm:px-3"
              onClick={() => setSubscribeOpen(true)}
            >
              <Mail className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{t('nav.subscribe')}</span>
            </Button>
            <Button
              size="sm"
              aria-label={t('nav.donate')}
              title={t('nav.donate')}
              className="gap-1.5 text-xs h-8 px-2 sm:px-3 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setDonateOpen(true)}
            >
              <Heart className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{t('nav.donate')}</span>
            </Button>
          </div>
        </div>
      </nav>
      <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />
      <DonationDialog open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  );
}

function Layout() {
  const location = useLocation();
  const isHeatmap = location.pathname === '/';

  if (isHeatmap) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 relative overflow-hidden">
          <Outlet />
        </main>
        <SecondaryNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-14">
        <Outlet />
      </main>
      <SecondaryNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <WelcomeDialogs />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/csos" element={<CSONetworkPage />} />
                <Route path="/csos/register" element={<CSORegisterPage />} />
                <Route path="/submit" element={<SubmitRumorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/impact" element={<ImpactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/staff/cso-review" element={<CSOReviewPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
