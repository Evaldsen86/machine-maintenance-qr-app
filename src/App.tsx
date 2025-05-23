import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from './hooks/useAuth';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MachineDetail from "./pages/MachineDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import AddMachine from "./pages/AddMachine";
import UserManagement from "./pages/UserManagement";
import { useState } from "react";
import Navbar from "@/components/Navbar";

// Create a query client with better config for offline/local storage use cases
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 300000, // 5 minutes
      gcTime: 3600000, // 1 hour - replacing cacheTime which is deprecated
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

// Protected route component that allows QR access to machine details
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isPublicAccess } = useAuth();
  const location = useLocation();
  
  // Check if this is a machine detail page with QR param
  const isMachineDetailPage = location.pathname.startsWith('/machine/');
  const hasQrParam = new URLSearchParams(location.search).has('qr');
  
  // Allow access to machine detail pages with QR param or via public access
  if (isMachineDetailPage && (hasQrParam || isPublicAccess)) {
    return <>{children}</>;
  }
  
  // Otherwise check for authentication
  if (!isAuthenticated) {
    // If not logged in, redirect to login
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component that only allows admin access
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  if (!isAuthenticated || !hasPermission('admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/machine/:id" element={
        <ProtectedRoute>
          <MachineDetail />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/add-machine" element={
        <AdminRoute>
          <AddMachine />
        </AdminRoute>
      } />
      <Route path="/user-management" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />
      <Route path="/settings" element={
        <AdminRoute>
          <Settings />
        </AdminRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Create a new QueryClient instance for better stability across page refreshes
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Navbar />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
