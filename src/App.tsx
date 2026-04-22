import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { WelcomeDialogs } from "@/components/WelcomeDialogs";
import { Map, Clock, Users, BarChart3, LayoutDashboard, Info, Mail, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Index from "./pages/Index.tsx";
import TimelinePage from "./pages/TimelinePage";
import CSONetworkPage from "./pages/CSONetworkPage";
import SubmitRumorPage from "./pages/SubmitRumorPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ImpactPage from "./pages/ImpactPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const secondaryLinks = [
  { to: '/', key: 'heatmap', icon: Map, end: true },
  { to: '/timeline', key: 'timeline', icon: Clock },
  { to: '/csos', key: 'csos', icon: Users },
  { to: '/impact', key: 'impact', icon: BarChart3 },
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/about', key: 'about', icon: Info },
] as const;

function SecondaryNav() {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-background/85 backdrop-blur-xl z-[1000]">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {secondaryLinks.map((l) => (
              <RouterNavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                  )
                }
              >
                <l.icon className="h-3.5 w-3.5" />
                {t(`nav.${l.key}`)}
              </RouterNavLink>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setSubscribeOpen(true)}
            >
              <Mail className="h-3.5 w-3.5" /> {t('nav.subscribe')}
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled title={t('nav.comingSoon')}>
              <Heart className="h-3.5 w-3.5" /> {t('nav.donate')}
            </Button>
          </div>
        </div>
      </nav>
      <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />
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
      <AppProvider>
        <BrowserRouter>
          <WelcomeDialogs />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/csos" element={<CSONetworkPage />} />
              <Route path="/submit" element={<SubmitRumorPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
