import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Trees, Settings, LogOut, Leaf } from "lucide-react";
import { useListFarms } from "@workspace/api-client-react";
import { useActiveFarm } from "../hooks/use-active-farm";
import { useAuth } from "../hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: farms, isLoading } = useListFarms();
  const { activeFarmId, setActiveFarmId } = useActiveFarm();
  const { user, signOut } = useAuth();

  React.useEffect(() => {
    if (farms && farms.length > 0 && !activeFarmId) {
      setActiveFarmId(farms[0].id);
    }
  }, [farms, activeFarmId, setActiveFarmId]);

  const handleSignOut = () => {
    signOut();
    navigate("/signin");
  };

  const pageTitle =
    location === "/" ? "Mission Control" :
    location === "/farms" ? "Farm Management" :
    location === "/settings" ? "Settings" : "Precision Harvest";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"><Leaf className="w-4 h-4 text-primary" /></div>
          <span className="font-bold text-lg tracking-tight">Precision Harvest</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${
              location === "/" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5"
            }`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </Link>
          <Link href="/farms">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${
              location === "/farms" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5"
            }`}>
              <Trees className="w-5 h-5" />
              <span className="font-medium">Farms</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${
              location === "/settings" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5"
            }`}>
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-border/40 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Live
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-20 px-8 flex items-center justify-between border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-10 w-[200px]" />
            ) : farms && farms.length > 0 ? (
              <Select value={activeFarmId ?? ""} onValueChange={setActiveFarmId}>
                <SelectTrigger className="w-[250px] bg-card border-card-border">
                  <SelectValue placeholder="Select a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
