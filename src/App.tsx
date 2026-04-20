import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import OnboardingFlow, { hasSeenOnboarding } from "@/components/OnboardingFlow";
import { FocusMiniPill } from "@/components/FocusWidget";
import { FocusProvider } from "@/lib/focusContext";
import HomePage from "./pages/HomePage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import RecallPage from "./pages/RecallPage";
import RecallSessionPage from "./pages/RecallSessionPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const handleSplashDone = useCallback(() => setShowSplash(false), []);
  const handleOnboardingDone = useCallback(() => setShowOnboarding(false), []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <FocusProvider>
            <Sonner />
            {showSplash && <SplashScreen onDone={handleSplashDone} />}
            {!showSplash && showOnboarding && <OnboardingFlow onDone={handleOnboardingDone} />}
            <BrowserRouter>
            <div className="mx-auto max-w-[768px]">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/subjects/:id" element={<SubjectDetailPage />} />
                <Route path="/topic/:nodeId" element={<TopicDetailPage />} />
                <Route path="/recall" element={<RecallPage />} />
                <Route path="/recall/session" element={<RecallSessionPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
              <FocusMiniPill />
            </div>
          </BrowserRouter>
        </FocusProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
