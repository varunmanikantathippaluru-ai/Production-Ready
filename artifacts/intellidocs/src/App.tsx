import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected-route';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Pages
import Landing from '@/pages/landing';
import Login from '@/pages/login';
import Register from '@/pages/register';
import ForgotPassword from '@/pages/forgot-password';
import VerifyEmail from '@/pages/verify-email';
import AuthCallback from '@/pages/auth-callback';
import Dashboard from '@/pages/dashboard';
import Documents from '@/pages/documents';
import DocumentDetail from '@/pages/document-detail';
import Chat from '@/pages/chat';
import Settings from '@/pages/settings';
import NotFound from '@/pages/not-found';

import AppLayout from '@/components/layout/app-layout';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/auth/callback" component={AuthCallback} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={() => <AppLayout><Dashboard /></AppLayout>} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={() => <AppLayout><Documents /></AppLayout>} />
      </Route>
      <Route path="/documents/:id">
        {(params) => <ProtectedRoute component={() => <AppLayout><DocumentDetail id={params.id} /></AppLayout>} />}
      </Route>
      <Route path="/chat/:conversationId">
        {(params) => <ProtectedRoute component={() => <AppLayout><Chat conversationId={params.conversationId} /></AppLayout>} />}
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={() => <AppLayout><Settings /></AppLayout>} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster position="top-right" richColors closeButton />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;