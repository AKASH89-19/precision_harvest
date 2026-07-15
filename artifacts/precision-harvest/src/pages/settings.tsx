import React, { useEffect } from "react";
import { useActiveFarm } from "../hooks/use-active-farm";
import { useGetFarm, getGetFarmQueryKey, useUpdateFarm, useSendTestNotification, getListFarmsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Save, Send } from "lucide-react";

const settingsSchema = z.object({
  location: z.string().min(1, "Location is required"),
  cropType: z.string().min(1, "Crop type is required"),
  notificationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { activeFarmId } = useActiveFarm();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: farm, isLoading } = useGetFarm(activeFarmId!, { 
    query: { enabled: !!activeFarmId, queryKey: getGetFarmQueryKey(activeFarmId!) } 
  });

  const updateFarm = useUpdateFarm();
  const sendNotification = useSendTestNotification();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      location: "",
      cropType: "",
      notificationEmail: "",
    },
  });

  useEffect(() => {
    if (farm) {
      form.reset({
        location: farm.location,
        cropType: farm.cropType,
        notificationEmail: farm.notificationEmail || "",
      });
    }
  }, [farm, form]);

  if (!activeFarmId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Select a farm from the header to manage its settings.</p>
      </div>
    );
  }

  const onSubmit = (data: SettingsFormValues) => {
    updateFarm.mutate({ id: activeFarmId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFarmQueryKey(activeFarmId) });
        queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
        toast({ title: "Settings saved successfully" });
      },
      onError: (err: any) => {
        const message = err?.response?.data?.error || "Failed to save settings";
        if (message.toLowerCase().includes("city") || message.toLowerCase().includes("valid")) {
          form.setError("location", { message });
        }
        toast({ title: message, variant: "destructive" });
      },
    });
  };

  const handleTestNotification = async () => {
    // Save first so the database and the alert use the same email
    await form.handleSubmit(onSubmit)();

    const email = form.getValues("notificationEmail");
    if (!email) {
      toast({ title: "Email required", description: "Please enter an email address first.", variant: "destructive" });
      return;
    }

    sendNotification.mutate({
      data: {
        email,
        farmName: farm?.name || "Your Farm",
        message: "This is a test notification from Precision Harvest AI.",
      },
    }, {
      onSuccess: () => {
        toast({ title: "Test notification sent" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[400px] w-full rounded-[1rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Farm Settings</h2>
        <p className="text-muted-foreground">Manage configuration for {farm?.name}.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Update location to improve weather accuracy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormDescription>Used for weather forecasting</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Corn" {...field} className="bg-black/20" />
                      </FormControl>
                      <FormDescription>Used for AI watering models</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-medium">Notifications</h3>
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="alerts@example.com" {...field} className="bg-black/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestNotification}
                    disabled={sendNotification.isPending}
                    className="w-full mt-2 bg-white/5 hover:bg-white/10 border-white/10"
                  >
                    <Send className="w-4 h-4 mr-2" /> 
                    Send Test Alert
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateFarm.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
