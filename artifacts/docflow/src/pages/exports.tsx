import { useState } from "react";
import { useListExportJobs, useCreateExportJob, useListDocuments, getListExportJobsQueryKey, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, CheckCircle, Clock, AlertCircle, Loader2, FileDown } from "lucide-react";

type ExportFormat = "sap" | "tally" | "zoho" | "oracle" | "busy" | "excel" | "csv" | "json" | "google_sheets";

const formatConfig: Record<ExportFormat, { label: string; color: string }> = {
  sap: { label: "SAP", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  tally: { label: "Tally", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  zoho: { label: "Zoho", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  oracle: { label: "Oracle ERP", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  busy: { label: "Busy", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  excel: { label: "Excel", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  csv: { label: "CSV", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  json: { label: "JSON", color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  google_sheets: { label: "Google Sheets", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
};

const jobStatusConfig = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: "Failed", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function Exports() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jobs, isLoading } = useListExportJobs({ query: { queryKey: getListExportJobsQueryKey() } });
  const { data: approvedDocs } = useListDocuments({ status: "approved" }, {
    query: { queryKey: getListDocumentsQueryKey({ status: "approved" }) }
  });
  const createMutation = useCreateExportJob();

  function toggleDoc(id: number) {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  }

  function createJob() {
    if (!selectedDocIds.length) { toast({ title: "Select at least one document", variant: "destructive" }); return; }
    createMutation.mutate(
      { data: { exportFormat: selectedFormat, documentIds: selectedDocIds, fieldMapping: {} } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExportJobsQueryKey() });
          setDialogOpen(false);
          setSelectedDocIds([]);
          toast({ title: "Export job created — processing in background" });
        },
        onError: () => toast({ title: "Failed to create export job", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ERP Export</h1>
          <p className="text-muted-foreground text-sm mt-1">Export processed documents to ERP systems</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-create-export">
          <Plus className="w-4 h-4 mr-2" />New Export Job
        </Button>
      </div>

      {/* Format cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {(Object.entries(formatConfig) as [ExportFormat, typeof formatConfig[ExportFormat]][]).map(([key, cfg]) => (
          <div key={key} className={`rounded-lg border p-3 text-center cursor-pointer transition-all ${cfg.color} ${selectedFormat === key ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
            onClick={() => setSelectedFormat(key)} data-testid={`card-format-${key}`}>
            <FileDown className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-medium">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Export jobs table */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Export History</h2>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Job ID</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : !jobs?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No export jobs yet
                  </TableCell>
                </TableRow>
              ) : jobs.map(job => {
                const sc = jobStatusConfig[job.status as keyof typeof jobStatusConfig] ?? jobStatusConfig.pending;
                const fc = formatConfig[job.exportFormat as ExportFormat];
                return (
                  <TableRow key={job.id} data-testid={`row-job-${job.id}`} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{job.id}</TableCell>
                    <TableCell>
                      {fc && <Badge variant="outline" className={`text-xs ${fc.color}`}>{fc.label}</Badge>}
                    </TableCell>
                    <TableCell><span className="font-medium">{job.documentCount}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${sc.color}`}>
                        {sc.icon}{sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.completedAt ? new Date(job.completedAt).toLocaleString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      {job.downloadUrl ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" asChild data-testid={`button-download-${job.id}`}>
                          <a href={job.downloadUrl} download><Download className="w-3 h-3 mr-1" />Download</a>
                        </Button>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Export Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Export Format</Label>
              <Select value={selectedFormat} onValueChange={v => setSelectedFormat(v as ExportFormat)}>
                <SelectTrigger data-testid="select-export-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(formatConfig) as [ExportFormat, typeof formatConfig[ExportFormat]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Select Approved Documents ({selectedDocIds.length} selected)</Label>
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                {!approvedDocs?.documents?.length ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No approved documents available</div>
                ) : approvedDocs.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/20" data-testid={`checkbox-doc-${doc.id}`}>
                    <Checkbox checked={selectedDocIds.includes(doc.id)} onCheckedChange={() => toggleDoc(doc.id)} id={`doc-${doc.id}`} />
                    <label htmlFor={`doc-${doc.id}`} className="text-sm cursor-pointer flex-1 truncate">{doc.fileName}</label>
                    <span className="text-xs text-muted-foreground">{doc.vendorName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createJob} disabled={createMutation.isPending || !selectedDocIds.length} data-testid="button-confirm-export">
              {createMutation.isPending ? "Creating..." : "Create Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
