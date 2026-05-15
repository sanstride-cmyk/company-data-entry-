import { useState } from "react";
import { useListWorkflowTasks, useActOnWorkflowTask, getListWorkflowTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertTriangle, Clock, ArrowUp, FileText } from "lucide-react";
import { Link } from "wouter";

type TaskStatus = "pending" | "approved" | "rejected" | "escalated";
type ActionType = "approve" | "reject" | "escalate";

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  escalated: { label: "Escalated", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <ArrowUp className="w-3 h-3" /> },
};

const taskTypeConfig: Record<string, string> = {
  review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  approval: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  export: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  escalation: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function Workflows() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{ taskId: number; action: ActionType } | null>(null);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status: statusFilter as TaskStatus } : {};
  const { data: tasks, isLoading } = useListWorkflowTasks(params, {
    query: { queryKey: getListWorkflowTasksQueryKey(params) }
  });

  const actMutation = useActOnWorkflowTask();

  function handleAction(taskId: number, action: ActionType) {
    setActionDialog({ taskId, action });
    setComment("");
  }

  function confirmAction() {
    if (!actionDialog) return;
    actMutation.mutate(
      { id: actionDialog.taskId, data: { action: actionDialog.action, comment, completedBy: "Current User" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkflowTasksQueryKey() });
          setActionDialog(null);
          toast({ title: `Task ${actionDialog.action}d successfully` });
        },
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflow Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage document approval workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Task ID</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !tasks?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No workflow tasks found
                </TableCell>
              </TableRow>
            ) : tasks.map(task => {
              const sc = statusConfig[task.status as TaskStatus] ?? statusConfig.pending;
              return (
                <TableRow key={task.id} data-testid={`row-task-${task.id}`} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">#{task.id}</TableCell>
                  <TableCell>
                    <Link href={`/documents/${task.documentId}`} className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <FileText className="w-3.5 h-3.5" />
                      Doc #{task.documentId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${taskTypeConfig[task.taskType] ?? ""}`}>
                      {task.taskType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${sc.color}`}>
                      {sc.icon}{sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{task.assignedTo ?? <span className="text-muted-foreground text-xs">Unassigned</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.dueDate ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {task.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          onClick={() => handleAction(task.id, "approve")} data-testid={`button-approve-${task.id}`}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => handleAction(task.id, "reject")} data-testid={`button-reject-${task.id}`}>
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                          onClick={() => handleAction(task.id, "escalate")} data-testid={`button-escalate-${task.id}`}>
                          <ArrowUp className="w-3 h-3 mr-1" />Escalate
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Completed</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionDialog?.action} Task #{actionDialog?.taskId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Comment (optional)</Label>
            <Textarea placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} rows={3} data-testid="input-action-comment" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={confirmAction} disabled={actMutation.isPending} data-testid="button-confirm-action">
              {actMutation.isPending ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
