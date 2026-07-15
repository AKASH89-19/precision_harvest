import React, { useState } from "react";
import { useListFarms, useCreateFarm, useUpdateFarm, useDeleteFarm, getListFarmsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Sprout, Plus, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const farmSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  cropType: z.string().min(1, "Crop type is required"),
  notificationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type FarmFormValues = z.infer<typeof farmSchema>;

export default function Farms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: farms, isLoading } = useListFarms();
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);

  const form = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      location: "",
      cropType: "",
      notificationEmail: "",
    },
  });

  const openEditDialog = (farm: any) => {
    setEditingFarmId(farm.id);
    form.reset({
      name: farm.name,
      location: farm.location,
      cropType: farm.cropType,
      notificationEmail: farm.notificationEmail || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingFarmId(null);
    form.reset({
      name: "",
      location: "",
      cropType: "",
      notificationEmail: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FarmFormValues) => {
    if (editingFarmId) {
      updateFarm.mutate({ id: editingFarmId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Farm updated" });
        },
        onError: (err: any) => {
          const message = err?.response?.data?.error || "Failed to update farm";
          if (message.toLowerCase().includes("city") || message.toLowerCase().includes("valid")) {
            form.setError("location", { message });
          }
          toast({ title: message, variant: "destructive" });
        }
      });
    } else {
      createFarm.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Farm created" });
        },
        onError: (err: any) => {
          const message = err?.response?.data?.error || "Failed to create farm";
          if (message.toLowerCase().includes("city") || message.toLowerCase().includes("valid")) {
            form.setError("location", { message });
          }
          toast({ title: message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this farm?")) {
      deleteFarm.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() });
          toast({ title: "Farm deleted" });
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON':
        return <Badge className="bg-primary hover:bg-primary text-primary-foreground border-none">Active</Badge>;
      case 'PAUSED_BY_AI':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10">AI Paused</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-white/10">Off</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Farms</h2>
          <p className="text-muted-foreground">Manage your irrigation locations and crop types.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingFarmId ? "Edit Farm" : "Add New Farm"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farm Name</FormLabel>
                      <FormControl>
                        <Input placeholder="North Sector" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (City)</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, US" {...field} className="bg-background" />
                      </FormControl>
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
                        <Input placeholder="Corn, Wheat, etc." {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notificationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Email</FormLabel>
                      <FormControl>
                        <Input placeholder="farmer@example.com" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4" disabled={createFarm.isPending || updateFarm.isPending}>
                  {editingFarmId ? "Save Changes" : "Create Farm"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : farms?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Sprout className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No farms found. Add your first farm to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Farm Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Crop Type</TableHead>
                  <TableHead>Pump Status</TableHead>
                  <TableHead className="text-right">Water Saved (L)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms?.map((farm) => (
                  <TableRow key={farm.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium">{farm.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {farm.location}
                      </div>
                    </TableCell>
                    <TableCell>{farm.cropType}</TableCell>
                    <TableCell>{getStatusBadge(farm.pumpStatus)}</TableCell>
                    <TableCell className="text-right font-mono text-blue-400">
                      {farm.waterSavedLiters.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(farm)} className="h-8 w-8 hover:bg-white/10">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(farm.id)} className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
