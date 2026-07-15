import React from "react";
import { useActiveFarm } from "../hooks/use-active-farm";
import { useListFarms, useGetFarm, getGetFarmQueryKey, useGetWeather, getGetWeatherQueryKey, useGetWeatherForecast, getGetWeatherForecastQueryKey, useGetAnalytics, getGetAnalyticsQueryKey, useRunIrrigationAutomation, useTogglePump, getListFarmsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Droplet, DollarSign, Activity, AlertTriangle, Wind, CloudRain, ThermometerSun, Play, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { activeFarmId } = useActiveFarm();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: farm, isLoading: isFarmLoading } = useGetFarm(activeFarmId!, { 
    query: { enabled: !!activeFarmId, queryKey: getGetFarmQueryKey(activeFarmId!) } 
  });

  const { data: weather, isLoading: isWeatherLoading } = useGetWeather(activeFarmId!, {
    query: { enabled: !!activeFarmId, queryKey: getGetWeatherQueryKey(activeFarmId!), refetchInterval: 300000 }
  });

  const { data: forecast, isLoading: isForecastLoading } = useGetWeatherForecast(activeFarmId!, {
    query: { enabled: !!activeFarmId, queryKey: getGetWeatherForecastQueryKey(activeFarmId!) }
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAnalytics(activeFarmId!, {
    query: { enabled: !!activeFarmId, queryKey: getGetAnalyticsQueryKey(activeFarmId!) }
  });

  const togglePump = useTogglePump();
  const runAutomation = useRunIrrigationAutomation();
  const { data: allFarms, isLoading: isFarmsLoading } = useListFarms();

  if (!activeFarmId) {
    if (isFarmsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    const hasNoFarms = !allFarms || allFarms.length === 0;
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="glass-card p-12 max-w-md w-full rounded-2xl flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <Droplet className="w-10 h-10 text-primary" />
          </div>
          {hasNoFarms ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Welcome to Precision Harvest</h2>
              <p className="text-muted-foreground mb-8">
                You don't have any farms yet. Add your first farm to start monitoring irrigation, weather, and crop health.
              </p>
              <Link href="/farms">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <span className="text-lg font-bold">+</span> Add Farm
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">No Farm Selected</h2>
              <p className="text-muted-foreground mb-6">Select a farm from the dropdown above to view its dashboard.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleTogglePump = () => {
    if (!farm) return;
    const newStatus = farm.pumpStatus === "ON" ? "OFF" : "ON";
    togglePump.mutate({ id: farm.id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFarmQueryKey(farm.id) });
        queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
        toast({
          title: "Pump Status Updated",
          description: `Pump turned ${newStatus}`,
        });
      }
    });
  };

  const handleRunAutomation = () => {
    if (!farm) return;
    runAutomation.mutate({ farmId: farm.id }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getGetFarmQueryKey(farm.id) });
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsQueryKey(farm.id) });
        toast({
          title: result.notificationSent ? "AI Evaluation Complete — Alert Sent!" : "AI Automation Run",
          description: `Action: ${result.action}. ${result.reason}${result.notificationSent ? " Email alert fired." : ""}`,
        });
      }
    });
  };

  const isLoading = isFarmLoading || isWeatherLoading || isForecastLoading || isAnalyticsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[300px] w-full rounded-[1rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[150px] w-full rounded-[1rem]" />
          <Skeleton className="h-[150px] w-full rounded-[1rem]" />
          <Skeleton className="h-[150px] w-full rounded-[1rem]" />
        </div>
      </div>
    );
  }

  const isPausedByAI = farm?.pumpStatus === "PAUSED_BY_AI";
  const isPumpOn = farm?.pumpStatus === "ON";

  // Dynamic status banner logic
  const rainProb = weather?.rainProbability ?? 100;
  const soilMoisture = farm?.currentMoisture ?? 100;
  const isSystemActive = rainProb < 50 && soilMoisture < 50;
  const isRainWarning = rainProb >= 50;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Dynamic Status Banner */}
      {isSystemActive ? (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.15)] animate-in fade-in duration-500">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-mono font-bold text-emerald-400 tracking-wider text-sm">🟢 SYSTEM ACTIVE</span>
          </div>
          <span className="text-emerald-300/80 text-sm">Soil moisture low. Initiating micro-irrigation.</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-emerald-500/70">
            <Zap className="w-3.5 h-3.5" />
            <span>LIVE</span>
          </div>
        </div>
      ) : isRainWarning ? (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.10)] animate-in fade-in duration-500">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-mono font-bold text-amber-400 tracking-wider text-sm">⚠️ RAIN DETECTED</span>
          <span className="text-amber-300/70 text-sm">
            {Math.round(rainProb)}% precipitation probability — irrigation auto-paused.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in duration-500">
          <Droplet className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="font-mono font-bold text-blue-400 tracking-wider text-sm">💧 MOISTURE OK</span>
          <span className="text-blue-300/70 text-sm">
            Soil at {soilMoisture}% — no irrigation required.
          </span>
        </div>
      )}

      {/* Hero Card */}
      <Card className="glass-card overflow-hidden border-none relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Weather & Location */}
            <div className="col-span-1 lg:col-span-4 space-y-6">
              <div className="flex items-center gap-4">
                {weather?.icon && (
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                    alt={weather.description}
                    className="w-20 h-20 drop-shadow-md"
                  />
                )}
                <div>
                  <h2 className="text-5xl font-display font-bold tracking-tighter">
                    {weather?.temperature.toFixed(1)}°
                  </h2>
                  <p className="text-muted-foreground text-lg uppercase tracking-widest">{weather?.city}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CloudRain className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Rain Prob</span>
                  </div>
                  <div className="text-xl font-mono">{weather?.rainProbability}%</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Wind</span>
                  </div>
                  <div className="text-xl font-mono">{weather?.windSpeed} m/s</div>
                </div>
              </div>
            </div>

            {/* AI Recommendation & Moisture */}
            <div className="col-span-1 lg:col-span-4 space-y-6 lg:border-x border-white/10 lg:px-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Soil Moisture</span>
                  <span className="font-mono text-lg">{farm?.currentMoisture}%</span>
                </div>
                <Progress value={farm?.currentMoisture} className="h-3" />
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <h3 className="text-sm font-semibold uppercase text-primary tracking-wider mb-1">AI Recommendation</h3>
                <p className="text-foreground/90">{weather?.recommendation}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-xs font-mono text-primary">
                  Duration Multiplier: {weather?.pumpDurationMultiplier}x
                </div>
              </div>
            </div>

            {/* Pump Control */}
            <div className="col-span-1 lg:col-span-4 flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Main Pump Status</h3>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={isPumpOn || isPausedByAI} 
                    onCheckedChange={handleTogglePump}
                    className={`data-[state=checked]:${isPausedByAI ? 'bg-amber-500' : 'bg-primary'} scale-150 transform origin-center`}
                  />
                  <span className={`text-xl font-bold tracking-widest ${isPumpOn ? 'text-primary' : isPausedByAI ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {farm?.pumpStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              {isPausedByAI && (
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Overridden by Rain Forecast</span>
                </div>
              )}

              <Button 
                onClick={handleRunAutomation}
                disabled={runAutomation.isPending}
                className="w-full bg-white/5 hover:bg-white/10 text-foreground border border-white/10 mt-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Trigger AI Evaluation
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Water Saved</p>
                <h3 className="text-4xl font-mono text-blue-400">{analytics?.totalWaterSavedLiters.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground mt-1">Liters</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Droplet className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Money Saved</p>
                <h3 className="text-4xl font-mono text-emerald-400">${analytics?.moneySaved.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                <p className="text-sm text-muted-foreground mt-1">Estimated</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Health Index</p>
                <h3 className="text-4xl font-mono text-primary">{analytics?.cropHealthIndex}%</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics?.irrigationEvents} events • {analytics?.skippedEvents} skipped
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>5-Day Weather Forecast</CardTitle>
            <CardDescription>Temperature & Rainfall Probability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast?.items || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d, HH:mm')} 
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={12}
                    tickMargin={10}
                  />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" fontSize={12} unit="°C" />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" fontSize={12} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1b1b', borderColor: '#3c4a42', borderRadius: '8px' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy HH:mm')}
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="rainProbability" name="Rain Prob %" fill="rgba(59, 130, 246, 0.3)" />
                  <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp °C" stroke="#10B981" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Weekly Usage vs Optimized</CardTitle>
            <CardDescription>Estimated liters of water used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics?.weeklyUsage || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c1b1b', borderColor: '#3c4a42', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="traditional" name="Traditional" fill="rgba(255, 255, 255, 0.1)" />
                  <Bar dataKey="optimized" name="AI Optimized" fill="#10B981" />
                  <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#3b82f6" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
