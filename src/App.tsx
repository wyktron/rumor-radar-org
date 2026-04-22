import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
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
// router-context-fix

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/40 py-4">
        <div className="container flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <div>Rumor Radar · Open intelligence platform</div>
          <div>v1.0 · Demo data — runs locally in your browser</div>
        </div>
      </footer>
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
