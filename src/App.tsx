import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { I18nProvider } from '@/context/I18nContext';
import { AppLayout } from '@/components/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PredictPage } from '@/pages/PredictPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AnimalsPage } from '@/pages/AnimalsPage';
import { AnimalDetailPage } from '@/pages/AnimalDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AdminPage } from '@/pages/AdminPage';
import { PageLoader } from '@/components/ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthPage mode="register" /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/predict" element={<ProtectedRoute><AppLayout><PredictPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/animals" element={<ProtectedRoute><AppLayout><AnimalsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/animals/:id" element={<ProtectedRoute><AppLayout><AnimalDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/app/admin" element={<ProtectedRoute><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
