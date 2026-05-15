import { useState } from "react";
import { UploadCloud, FileType, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Center</h1>
        <p className="text-muted-foreground mt-2">Upload documents for AI extraction and processing.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div 
            className={`border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); setUploaded(true); }}
          >
            {uploaded ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Files uploaded successfully</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">3 files are now in the processing queue</p>
                <Button onClick={() => setUploaded(false)}>Upload More</Button>
              </>
            ) : (
              <>
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <UploadCloud className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & drop files here</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Support for PDF, JPG, PNG, Excel, and CSV files up to 50MB each.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline">Browse Files</Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
             <CardTitle className="text-sm">Invoices & Bills</CardTitle>
             <CardDescription className="text-xs">GST, Non-GST, Proforma</CardDescription>
          </CardHeader>
          <CardContent>
             <FileType className="h-8 w-8 text-blue-500 opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
             <CardTitle className="text-sm">Logistics</CardTitle>
             <CardDescription className="text-xs">Delivery Challans, LRs</CardDescription>
          </CardHeader>
          <CardContent>
             <FileType className="h-8 w-8 text-amber-500 opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
             <CardTitle className="text-sm">Procurement</CardTitle>
             <CardDescription className="text-xs">Purchase Orders, Quotes</CardDescription>
          </CardHeader>
          <CardContent>
             <FileType className="h-8 w-8 text-green-500 opacity-50" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}