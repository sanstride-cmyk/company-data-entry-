import { useGetReviewQueue } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ReviewQueue() {
  const { data, isLoading } = useGetReviewQueue();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Queue is empty. Great job!
                </TableCell>
              </TableRow>
            ) : (
              data?.map((item) => (
                <TableRow key={item.document.id}>
                  <TableCell>
                    <Badge variant={item.document.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.document.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.document.fileName}</TableCell>
                  <TableCell>{item.document.vendorName || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.pendingSince).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.validationCount > 0 && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none">
                        {item.validationCount} issues
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/documents/${item.document.id}`}>
                      <Button size="sm" variant="secondary">Review</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}