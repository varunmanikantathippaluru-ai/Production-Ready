import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Route } from 'wouter';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Route {...rest} component={Component} />;
};
