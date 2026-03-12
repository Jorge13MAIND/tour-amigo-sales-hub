import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { useRealtimeDeals } from "@/hooks/useRealtimeDeals";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Decisions from "./pages/Decisions";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Metrics = lazy(() => import("./pages/Metrics"));

const queryClient = new QueryClient();

function AppRoutes() {
  useRealtimeDeals();
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/decisions" element={<Decisions />} />
        <Route path="/metrics" element={
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <Metrics />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
