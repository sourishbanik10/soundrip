import { useState } from "react";
import { YoutubeInput } from "@/components/youtube-input";
import { FileUpload } from "@/components/file-upload";
import { ActiveConversion } from "@/components/active-conversion";
import { ConversionHistory } from "@/components/conversion-history";
import { Headphones, AudioWaveform } from "lucide-react";

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground relative selection:bg-primary/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      <header className="w-full border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <Headphones className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight flex items-center">
              Sound<span className="text-primary">Rip</span>
            </h1>
          </div>
          <div className="flex items-center text-sm font-mono text-muted-foreground gap-2">
            <AudioWaveform className="w-4 h-4 text-primary" />
            <span>High-Fidelity Audio Extraction</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 pb-24 relative z-10 space-y-12">
        
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Extract Audio. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Zero Noise.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Paste a YouTube link or drop a video file. Get a pristine MP3 in seconds. Built for producers, creators, and audiophiles.
          </p>
        </section>

        {/* Converter Core */}
        <section className="space-y-6">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center bg-card p-6 md:p-8 rounded-2xl border border-card-border shadow-2xl">
            <div className="w-full">
              <h3 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">01 // Web Source</h3>
              <YoutubeInput onStart={setActiveJobId} />
            </div>
            
            <div className="hidden md:flex flex-col items-center justify-center px-4">
              <div className="h-16 w-px bg-border/50" />
              <span className="text-xs font-mono text-muted-foreground my-4 uppercase">OR</span>
              <div className="h-16 w-px bg-border/50" />
            </div>
            
            <div className="flex md:hidden items-center gap-4 py-2">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs font-mono text-muted-foreground uppercase">OR</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="w-full">
              <h3 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">02 // Local File</h3>
              <FileUpload onStart={setActiveJobId} />
            </div>
          </div>

          {/* Active Job State */}
          {activeJobId && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ActiveConversion 
                jobId={activeJobId} 
                onClear={() => setActiveJobId(null)} 
              />
            </div>
          )}
        </section>

        {/* History Panel */}
        <section className="pt-8 border-t border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-xl font-semibold">Recent Rips</h3>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-mono text-muted-foreground">Session History</span>
          </div>
          <div className="max-w-3xl">
            <ConversionHistory />
          </div>
        </section>

      </main>
    </div>
  );
}
