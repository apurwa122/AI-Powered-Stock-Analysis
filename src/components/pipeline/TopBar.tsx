import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SYMBOLS, HORIZONS } from "@/lib/symbols";

export function TopBar({
  symbol, setSymbol, custom, setCustom, horizon, setHorizon, onRun, loading,
}: {
  symbol: string; setSymbol: (v: string) => void;
  custom: string; setCustom: (v: string) => void;
  horizon: number; setHorizon: (v: number) => void;
  onRun: () => void; loading: boolean;
}) {
  return (
    <header className="min-h-14 border-b border-border bg-panel px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-30 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-bull animate-pulse" />
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
          MINOR PROJECT <span className="text-cyan-q mx-1">//</span> ECE DSP <span className="text-cyan-q mx-1">+</span> ML PIPELINE
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[200px] h-9 font-mono text-xs bg-panel-elevated border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-border max-h-80">
            {SYMBOLS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="font-mono text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value.toUpperCase())}
          placeholder="Custom symbol"
          className="w-[150px] h-9 font-mono text-xs bg-panel-elevated border-border"
        />
        <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
          <SelectTrigger className="w-[80px] h-9 font-mono text-xs bg-panel-elevated border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-border">
            {HORIZONS.map((h) => (
              <SelectItem key={h.value} value={String(h.value)} className="font-mono text-xs">{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={onRun}
          disabled={loading}
          className="h-9 font-mono text-xs bg-cyan_q text-background hover:bg-cyan_q/90 px-5 glow-cyan"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5 fill-background" />}
          {loading ? "RUNNING" : "RUN"}
        </Button>
      </div>
    </header>
  );
}