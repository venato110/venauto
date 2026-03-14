import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import SplashScreen from "./pages/SplashScreen";
import AuthPage from "./pages/AuthPage";
import MapScreen from "./pages/MapScreen";
import ReservationsPage from "./pages/ReservationsPage";
import WalletPage from "./pages/WalletPage";
import AddListingPage from "./pages/AddListingPage";
import MyListingsPage from "./pages/MyListingsPage";
import EarningsPage from "./pages/EarningsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/map" element={<ProtectedRoute><MapScreen /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/add-listing" element={<ProtectedRoute><AddListingPage /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
