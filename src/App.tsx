import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { useRealtimeDeals } from "@/hooks/useRealtimeDeals";
import { useRealtimeAtlas } from "@/hooks/useRealtimeAtlas";
import { useRealtimeDealRooms } from "@/hooks/useRealtimeDealRooms";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Decisions from "./pages/Decisions";
import Login from "./pages/Login";
import MfaSetup from "./pages/MfaSetup";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const Metrics = lazy(() => import("./pages/Metrics"));
const AgentFeed = lazy(() => import("./pages/AgentFeed"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Improvements = lazy(() => import("./pages/Improvements"));
const DealRoomList = lazy(() => import("./pages/DealRoomList"));
const DealRoom = lazy(() => import("./pages/DealRoom"));
const Outreach = lazy(() => import("./pages/Outreach"));

const queryClient = new QueryClient();

const LazyFallback = () => <Skeleton className="h-96 rounded-xl" />;

function AuthGate() {
  const { session, isLoading, mfaVerified, mfaRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (mfaRequired && !mfaVerified) {
    return <MfaSetup />;
  }

  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

function AppRoutes() {
  useRealtimeDeals();
  useRealtimeAtlas();
  useRealtimeDealRooms();
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/decisions" element={<Decisions />} />
        <Route path="/metrics" element={<Suspense fallback={<LazyFallback />}><Metrics /></Suspense>} />
        <Route path="/agents" element={<Suspense fallback={<LazyFallback />}><AgentFeed /></Suspense>} />
        <Route path="/follow-ups" element={<Suspense fallback={<LazyFallback />}><FollowUps /></Suspense>} />
        <Route path="/approvals" element={<Suspense fallback={<LazyFallback />}><Approvals /></Suspense>} />
        <Route path="/improvements" element={<Suspense fallback={<LazyFallback />}><Improvements /></Suspense>} />
        <Route path="/deal-rooms" element={<Suspense fallback={<LazyFallback />}><DealRoomList /></Suspense>} />
        <Route path="/deal-rooms/:id" element={<Suspense fallback={<LazyFallback />}><DealRoom /></Suspense>} />
        <Route path="/outreach" element={<Suspense fallback={<LazyFallback />}><Outreach /></Suspense>} />
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
      <BrowserRouter>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
