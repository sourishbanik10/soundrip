import { useEffect } from "react";
import { useGetConversionStatus, getGetConversionStatusQueryKey } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, XCircle, FileAudio, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetConversionHistoryQueryKey } from "@workspace/api-client-react";

interface ActiveConversionProps {
  jobId: string;
  onClear: () => void;
}

export function ActiveConversion({ jobId, onClear }: ActiveConversionProps) {
  const queryClient = useQueryClient();
  
  const { data: status } = useGetConversionStatus(jobId, {
    query: {
      enabled: !!jobId,
      queryKey: getGetConversionStatusQueryKey(jobId),
      refetchInterval: (query) => {
        const state = query.state.data?.status;
        return (state === "completed" || state === "failed") ? false : 2000;
      }
    }
  });

  const isCompleted = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const isProcessing = status?.status === "processing";
  const progressValue = status?.progress || 0;

  // Invalidate history when completed
  useEffect(() => {
    if (isCompleted || isFailed) {
      queryClient.invalidateQueries({ queryKey: getGetConversionHistoryQueryKey() });
    }
  }, [isCompleted, isFailed, queryClient]);

  if (!status) {
    return (
      <div className="p-6 rounded-xl border border-card-border bg-card shadow-lg flex items-center justify-center min-h-[120px]">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-xl border border-primary/20 bg-card/80 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(0,255,255,0.1)] relative overflow-hidden">
      {/* Decorative pulse background when processing */}
      {isProcessing && (
        <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
        
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : isFailed ? (
              <AlertTriangle className="w-6 h-6 text-destructive" />
            ) : (
              <FileAudio className="w-6 h-6 text-accent" />
            )}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="text-lg font-semibold truncate" title={status.title || status.filename || "Processing Audio..."}>
              {status.title || status.filename || "Processing Audio..."}
            </h4>
            
            <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
              <span className="capitalize">{status.status}</span>
              {isProcessing && <span>{Math.round(progressValue)}%</span>}
            </div>
            
            {isFailed && status.error && (
              <p className="text-sm text-destructive mt-1">{status.error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isProcessing || status.status === "pending" ? (
             <div className="w-full md:w-48 h-2 bg-secondary rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 ease-out" 
                 style={{ width: `${progressValue}%` }}
               />
             </div>
          ) : isCompleted ? (
            <Button asChild className="w-full md:w-auto h-12 px-6 font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <a href={`${import.meta.env.BASE_URL}api/convert/download/${jobId}`} download>
                <Download className="w-5 h-5 mr-2" />
                DOWNLOAD MP3
              </a>
            </Button>
          ) : null}
          
          {(isCompleted || isFailed) && (
            <Button variant="ghost" size="icon" onClick={onClear} className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground">
              <XCircle className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
