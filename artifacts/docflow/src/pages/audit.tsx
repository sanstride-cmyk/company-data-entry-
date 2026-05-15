import { useState } from "react";
import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Search, FileText, User, Shield, Clock } from "lucide-react";

const actionConfig: Record<string, { color: string; label: string }> = {
  document_uploaded: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Uploaded" },
  document_updated: { color: "bg-violet-500/15 text-violet-400 border-violet-500/30", label: "Updated" },
  document_processed: { color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", label: "AI Processed" },
  document_reprocessed: { color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", label: "Reprocessed" },
  document_approved: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Approved" },
  document_rejected: { color: "bg-red-500/15 text-red-400 border-red-500/30", label: "Rejected" },
  document_request_changesd: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "Changes Requested" },
  extraction_corrected: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Extraction Corrected" },
  workflow_task_approved: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Task Approved" },
  workflow_task_rejected: { color: "bg-red-500/15 text-red-400 border-red-500/30", label: "Task Rejected" },
  workflow_task_escalated: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Task Escalated" },
  export_completed: { color: "bg-teal-500/15 text-teal-400 border-teal-500/30", label: "Export Completed" },
};

const actorConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  ai_engine: { icon: <Shield className="w-3 h-3" />, color: "text-cyan-400" },
  system: { icon: <Clock className="w-3 h-3" />, color: "text-muted-foreground" },
};

export default function Audit() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);

  const params = { page, limit: 50 };
  const { data: logs, isLoading } = useListAuditLogs(params, {
    query: { queryKey: getListAuditLogsQueryKey(params) }
  });

  const filtered = search
    ? (logs ?? []).filter(l =>
        l.action.includes(search.toLowerCase()) ||
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        String(l.documentId ?? "").includes(search)
      )
    : (logs ?? []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete log of all system actions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          Enterprise-grade audit logging
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Filter by action, actor, or document..." value={search}
          onChange={e => setSearch(e.target.value)} data-testid="input-search-audit" />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : filtered.map(log => {
              const ac = actionConfig[log.action];
              const act = actorConfig[log.actor];
              return (
                <TableRow key={log.id} data-testid={`row-log-${log.id}`} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${ac?.color ?? "bg-muted text-muted-foreground"}`}>
                      {ac?.label ?? log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1.5 text-sm ${act?.color ?? "text-foreground"}`}>
                      {act?.icon ?? <User className="w-3 h-3" />}
                      {log.actor}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.documentId ? (
                      <Link href={`/documents/${log.documentId}`} className="flex items-center gap-1 text-primary hover:underline text-sm">
                        <FileText className="w-3.5 h-3.5" />Doc #{log.documentId}
                      </Link>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {Object.keys(log.details ?? {}).length > 0
                      ? Object.entries(log.details as Record<string, unknown>).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
