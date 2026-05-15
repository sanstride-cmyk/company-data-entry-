import { useState } from "react";
import { useListVendors, useCreateVendor, useUpdateVendor, getListVendorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, CheckCircle, XCircle, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

const categories = ["Manufacturing", "Logistics", "IT Services", "Energy", "Trading", "Retail", "Construction", "Healthcare", "Other"];

interface VendorFormData {
  name: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  category: string;
}

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<{ id: number } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = search ? { search } : {};
  const { data: vendors, isLoading } = useListVendors(params, {
    query: { queryKey: getListVendorsQueryKey(params) }
  });

  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  const form = useForm<VendorFormData>({
    defaultValues: { name: "", gstin: "", pan: "", email: "", phone: "", address: "", category: "Manufacturing" }
  });

  function openCreate() {
    form.reset({ name: "", gstin: "", pan: "", email: "", phone: "", address: "", category: "Manufacturing" });
    setEditVendor(null);
    setDialogOpen(true);
  }

  function openEdit(v: { id: number; name: string; gstin?: string | null; pan?: string | null; email?: string | null; phone?: string | null; address?: string | null; category?: string | null }) {
    form.reset({
      name: v.name,
      gstin: v.gstin ?? "",
      pan: v.pan ?? "",
      email: v.email ?? "",
      phone: v.phone ?? "",
      address: v.address ?? "",
      category: v.category ?? "Other",
    });
    setEditVendor({ id: v.id });
    setDialogOpen(true);
  }

  function onSubmit(data: VendorFormData) {
    const payload = {
      name: data.name,
      gstin: data.gstin || null,
      pan: data.pan || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      category: data.category || null,
    };

    if (editVendor) {
      updateMutation.mutate(
        { id: editVendor.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Vendor updated" });
          },
          onError: () => toast({ title: "Failed to update vendor", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Vendor created" });
          },
          onError: () => toast({ title: "Failed to create vendor", variant: "destructive" }),
        }
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your vendor master data</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-vendor">
          <Plus className="w-4 h-4 mr-2" />Add Vendor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-vendor" />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Vendor</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>PAN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !vendors?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  No vendors found
                </TableCell>
              </TableRow>
            ) : vendors.map(v => (
              <TableRow key={v.id} data-testid={`row-vendor-${v.id}`} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.email ?? "—"}</div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{v.gstin ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{v.pan ?? "—"}</TableCell>
                <TableCell>
                  {v.category && (
                    <Badge variant="outline" className="text-xs">{v.category}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{v.phone ?? "—"}</TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{v.totalDocuments}</span>
                </TableCell>
                <TableCell>
                  {v.isActive ? (
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle className="w-3 h-3 mr-1" />Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-red-400 border-red-500/30 bg-red-500/10">
                      <XCircle className="w-3 h-3 mr-1" />Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(v)} data-testid={`button-edit-vendor-${v.id}`}>
                    <Pencil className="w-3 h-3 mr-1" />Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" rules={{ required: true }} render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Tata Steel Limited" data-testid="input-vendor-name" /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="gstin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl><Input {...field} placeholder="27AAAAA0000A1Z5" className="font-mono text-xs" data-testid="input-vendor-gstin" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="pan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl><Input {...field} placeholder="AAAAA0000A" className="font-mono text-xs" data-testid="input-vendor-pan" /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="accounts@vendor.com" data-testid="input-vendor-email" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} placeholder="+91-00-0000-0000" data-testid="input-vendor-phone" /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-vendor-category"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} placeholder="Full address" data-testid="input-vendor-address" /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-vendor">
                  {isPending ? "Saving..." : editVendor ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
