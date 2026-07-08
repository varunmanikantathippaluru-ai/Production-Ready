import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListDocuments, 
  useDeleteDocument,
  getListDocumentsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { formatBytes as formatBytesUtil } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  UploadCloud, 
  MoreVertical, 
  Trash2, 
  MessageSquare,
  Loader2,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Documents() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docsData, isLoading } = useListDocuments(
    { search: search || undefined }, 
    { query: { queryKey: getListDocumentsQueryKey({ search: search || undefined }) } }
  );

  const deleteDocMutation = useDeleteDocument();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (PDF, DOCX, TXT)
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    // Size limit 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Fake progress to start

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      setUploadProgress(50); // Mid-way fake progress

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || `Upload failed (${res.status}): ${res.statusText}`);
      }

      setUploadProgress(100);
      toast.success("Document uploaded successfully");
      
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      await deleteDocMutation.mutateAsync({ id: documentToDelete });
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and chat with your uploaded files.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search documents..." 
              className="pl-9 bg-card/50 backdrop-blur"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect} 
          />
        </div>
      </div>

      {isUploading && (
        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 text-primary animate-spin" />
            <span className="font-medium text-sm">Uploading and processing document...</span>
          </div>
          <span className="text-sm text-primary font-medium">{uploadProgress}%</span>
        </div>
      )}

      <div className="flex-1 overflow-auto -mx-2 px-2 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/30 border-white/5">
                <CardContent className="p-5 flex items-start gap-4">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : docsData?.documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-card/10">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <File className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No documents found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {search 
                ? "We couldn't find any documents matching your search." 
                : "Upload your first document to start extracting knowledge and chatting."}
            </p>
            {!search && (
              <Button onClick={() => fileInputRef.current?.click()}>
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docsData?.documents.map((doc) => (
              <Card key={doc.id} className="group bg-card/40 hover:bg-card/60 backdrop-blur border-white/5 shadow-sm transition-all hover:border-primary/20 hover:shadow-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="size-5" />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setLocation(`/documents/${doc.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setDocumentToDelete(doc.id)}
                        >
                          <Trash2 className="size-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-base mb-1 truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="uppercase tracking-wider font-medium">{doc.fileType.split('/')[1] || 'DOC'}</span>
                    <span>•</span>
                    <span>{formatBytesUtil(doc.fileSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.createdAt))} ago
                    </div>
                    
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="secondary" className="h-7 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0">
                        <MessageSquare className="size-3 mr-1.5" />
                        Open
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!documentToDelete} onOpenChange={(o) => !o && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              and all its associated conversations and generated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteDocMutation.isPending}
            >
              {deleteDocMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}