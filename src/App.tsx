import * as React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ReportPage from "./pages/ReportPage";
import MyIncidentsPage from "./pages/MyIncidentsPage";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";
import MessagesPage from "./pages/MessagesPage";
import PresentationPage from "./pages/PresentationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { profile, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/presentation" element={<PresentationPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/report" element={<ProtectedRoute roles={['citizen']}><ReportPage /></ProtectedRoute>} />
      <Route path="/my-incidents" element={<ProtectedRoute roles={['citizen']}><MyIncidentsPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['responder', 'admin']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute roles={['responder', 'admin']}><MapPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
      <Route path="/messages/:incidentId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
