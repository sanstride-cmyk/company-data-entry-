import { useGetDocument, useGetExtraction } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { StatusBadge, ConfidenceBadge } from "./documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DocumentDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: doc, isLoading: docLoading } = useGetDocument(id, {
    query: { enabled: !!id, queryKey: ["getDocument", id] }
  });
  
  const { data: extraction, isLoading: extractionLoading } = useGetExtraction(id, {
    query: { enabled: !!id, queryKey: ["getExtraction", id] }
  });

  if (docLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[600px] w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!doc) return <div>Document not found</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{doc.fileName}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={doc.status} />
            <ConfidenceBadge score={doc.confidenceScore} />
            <span className="text-sm text-muted-foreground capitalize">{doc.docType.replace("_", " ")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Reject</Button>
          <Button>Approve</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="flex flex-col">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium">Document Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/30 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-4 bg-white dark:bg-zinc-900 shadow-sm border rounded flex items-center justify-center p-8">
              {doc.fileUrl ? (
                <iframe src={doc.fileUrl} className="w-full h-full border-0" title="Document Preview" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Simulated Document Preview</p>
                  <p className="text-xs mt-2 font-mono">{doc.fileName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium">Extracted Data</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto">
            {extractionLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : extraction ? (
              <div className="p-0">
                <div className="grid grid-cols-[150px_1fr_60px] gap-2 p-3 text-xs font-medium text-muted-foreground border-b bg-muted/10">
                  <div>Field</div>
                  <div>Value</div>
                  <div className="text-right">Score</div>
                </div>
                
                {[
                  { label: "Invoice Number", value: extraction.invoiceNumber, key: "invoiceNumber" },
                  { label: "Invoice Date", value: extraction.invoiceDate, key: "invoiceDate" },
                  { label: "Vendor Name", value: extraction.vendorName, key: "vendorName" },
                  { label: "Vendor GSTIN", value: extraction.vendorGstin, key: "vendorGstin" },
                  { label: "Total Amount", value: extraction.totalAmount, key: "totalAmount" },
                  { label: "Tax Amount", value: extraction.taxAmount, key: "taxAmount" },
                ].map((field) => (
                  <div key={field.key} className="grid grid-cols-[150px_1fr_60px] gap-2 p-3 border-b text-sm items-center hover:bg-muted/50 transition-colors">
                    <div className="font-medium text-muted-foreground">{field.label}</div>
                    <div className="font-mono">{field.value || "-"}</div>
                    <div className="text-right">
                      {extraction.fieldConfidences?.[field.key] ? 
                        <ConfidenceBadge score={extraction.fieldConfidences[field.key]} /> : 
                        <span className="text-muted-foreground">-</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No extraction data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}