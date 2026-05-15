import { useListDocuments } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    uploaded: "bg-slate-500",
    processing: "bg-blue-500 animate-pulse",
    extracted: "bg-indigo-500",
    review_pending: "bg-amber-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    exported: "bg-purple-500",
  };
  
  return (
    <Badge className={`${variants[status] || "bg-gray-500"} text-white border-none hover:opacity-80`}>
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}

export function ConfidenceBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null) return <span className="text-muted-foreground">-</span>;
  
  let color = "bg-red-500/20 text-red-500";
  if (score >= 0.9) color = "bg-green-500/20 text-green-500";
  else if (score >= 0.7) color = "bg-amber-500/20 text-amber-500";
  
  return (
    <Badge variant="outline" className={`${color} border-none`}>
      {(score * 100).toFixed(0)}%
    </Badge>
  );
}

export default function Documents() {
  const { data, isLoading } = useListDocuments({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                </TableRow>
              ))
            ) : data?.documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              data?.documents.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/documents/${doc.id}`} className="hover:underline text-primary">
                      {doc.fileName}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{doc.docType.replace("_", " ")}</TableCell>
                  <TableCell><StatusBadge status={doc.status} /></TableCell>
                  <TableCell><ConfidenceBadge score={doc.confidenceScore} /></TableCell>
                  <TableCell>{doc.vendorName || "-"}</TableCell>
                  <TableCell>{format(new Date(doc.createdAt), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}