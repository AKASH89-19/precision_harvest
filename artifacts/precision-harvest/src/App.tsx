import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveFarmProvider } from "./hooks/use-active-farm";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { AppLayout } from "./components/layout";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import Dashboard from "./pages/dashboard";
import Farms from "./pages/farms";
import Settings from "./pages/settings";
import SignIn from "./pages/signin";
import SignUp from "./pages/signup";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

setAuthTokenGetter(() => localStorage.getItem("ph_jwt_token"));

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/farms" component={() => <ProtectedRoute component={Farms} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isAuthPage = location === "/signin" || location === "/signup";

  if (isAuthPage || !isAuthenticated) return <>{children}</>;
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveFarmProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AuthenticatedLayout>
                <Router />
              </AuthenticatedLayout>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ActiveFarmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
