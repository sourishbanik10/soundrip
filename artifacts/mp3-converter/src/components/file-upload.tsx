import { useState, useRef } from "react";
import { UploadCloud, FileVideo, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onStart: (jobId: string) => void;
}

export function FileUpload({ onStart }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    const validTypes = ["video/mp4", "video/x-matroska", "video/quicktime", "video/x-msvideo", "video/webm"];
    const validExtensions = [".mp4", ".mkv", ".mov", ".avi", ".webm"];
    
    // Looser validation fallback
    const isExtensionValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!validTypes.includes(file.type) && !isExtensionValid) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP4, MKV, MOV, AVI, or WEBM file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      
      const res = await fetch(`${import.meta.env.BASE_URL}api/convert/upload`, { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      
      const job = await res.json();
      onStart(job.jobId);
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message || "Failed to upload file.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all duration-300",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-muted-foreground/30 bg-card hover:border-primary/50 hover:bg-card/80",
        isUploading && "pointer-events-none opacity-80"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".mp4,.mkv,.mov,.avi,.webm,video/*"
        onChange={handleFileSelect}
      />
      
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4 group-hover:scale-110 transition-transform duration-300">
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : isDragging ? (
          <UploadCloud className="w-8 h-8 text-primary animate-bounce" />
        ) : (
          <FileVideo className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
      
      <h3 className="text-lg font-medium mb-1">
        {isUploading ? "Uploading video..." : "Drop video file here"}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {isUploading ? "Please wait while we process your file." : "or click to browse. Supports MP4, MKV, MOV, AVI, WEBM"}
      </p>
    </div>
  );
}
