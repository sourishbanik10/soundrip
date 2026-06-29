import { useGetConversionHistory } from "@workspace/api-client-react";
import { FileAudio, Download, Clock, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConversionHistory() {
  const { data: history, isLoading } = useGetConversionHistory();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-card/50 rounded-xl border border-border" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card/30 rounded-xl border border-dashed border-border/50">
        <Music className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">No recent conversions found.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Your ripped audio will appear here.</p>
      </div>
    );
  }

  // Filter out non-completed ones if we only want to show successful ones, 
  // or show all. The prompt says "Recent conversions history panel".
  return (
    <div className="space-y-3">
      {history.map((job) => (
        <div key={job.jobId} className="flex items-center justify-between p-4 bg-card/50 hover:bg-card border border-card-border rounded-xl transition-colors group">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <FileAudio className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0">
              <h5 className="font-medium text-sm truncate" title={job.title || job.filename || "Unknown Audio"}>
                {job.title || job.filename || "Unknown Audio"}
              </h5>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(job.createdAt).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          {job.status === "completed" && (
            <Button asChild variant="secondary" size="sm" className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <a href={`${import.meta.env.BASE_URL}api/convert/download/${job.jobId}`} download>
                <Download className="w-4 h-4 mr-2" />
                Save
              </a>
            </Button>
          )}
          {job.status === "failed" && (
            <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-md">Failed</span>
          )}
          {(job.status === "pending" || job.status === "processing") && (
            <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-md capitalize">{job.status}</span>
          )}
        </div>
      ))}
    </div>
  );
}
