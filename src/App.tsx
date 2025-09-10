import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PeriodProvider } from "@/providers/PeriodProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Budget from "./pages/Budget";
import Categories from "./pages/Categories";
import Family from "./pages/Family";
import Expenses from "./pages/Expenses";
import Import from "./pages/Import";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import { FiltersProvider } from "@/providers/FiltersProvider";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FiltersProvider>
    <PeriodProvider>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Index />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/budget" element={
            <ProtectedRoute>
              <AppLayout>
                <Budget />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <AppLayout>
                <Categories />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/family" element={
            <ProtectedRoute>
              <AppLayout>
                <Family />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <AppLayout>
                <Expenses />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/import" element={
            <ProtectedRoute>
              <AppLayout>
                <Import />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounts" element={
            <ProtectedRoute>
              <AppLayout>
                <Accounts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute>
              <AppLayout>
                <Alerts />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </PeriodProvider>
    </FiltersProvider>
  </QueryClientProvider>
);

export default App;
