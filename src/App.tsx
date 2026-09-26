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
import { WelcomeDialogs } from "@/components/WelcomeDialogs";
import { HackathonBanner } from "@/components/HackathonBanner";
import { DeckTriggerButton } from "@/components/deck/DeckTriggerButton";
import { Map, Clock, Users, BarChart3, LayoutDashboard, Info, Mail } from "lucide-react";


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
import LegalPage from "./pages/LegalPage";
import CSOReviewPage from "./pages/CSOReviewPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function Layout() {
  const location = useLocation();
  const isHeatmap = location.pathname === '/';

  if (isHeatmap) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <HackathonBanner />
        <Header />
        <main className="flex-1 relative overflow-hidden">
          <Outlet />
        </main>
        <DeckTriggerButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HackathonBanner />
      <Header />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <DeckTriggerButton />
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
                <Route path="/terms" element={<LegalPage type="terms" />} />
                <Route path="/privacy" element={<LegalPage type="privacy" />} />
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
