import { useState } from "react";
import { useConvertYoutube } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YoutubeInputProps {
  onStart: (jobId: string) => void;
}

export function YoutubeInput({ onStart }: YoutubeInputProps) {
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const convertMutation = useConvertYoutube();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    convertMutation.mutate(
      { data: { url } },
      {
        onSuccess: (data) => {
          setUrl("");
          onStart(data.jobId);
        },
        onError: () => {
  toast({
    title: "Error starting conversion",
    description: "Please check the URL and try again.",
    variant: "destructive",
  });
}
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
          <Youtube className="w-5 h-5" />
        </div>
        <Input
          type="url"
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-12 h-14 bg-card/80 border-card-border focus-visible:ring-primary/50 text-lg shadow-inner"
          disabled={convertMutation.isPending}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!url || convertMutation.isPending} 
        className="h-14 px-8 font-bold tracking-[0.1em] text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]"
      >
        {convertMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "RIP AUDIO"}
        {!convertMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
      </Button>
    </form>
  );
}
