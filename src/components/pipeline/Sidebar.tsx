import { Database, Filter, Brain, BarChart3, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyzeResult } from "@/lib/symbols";

export type Step = "data" | "filter" | "predict" | "metrics" | "method";

const STEPS: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "data", label: "Data Overview", icon: Database },
  { id: "filter", label: "Filter Lab", icon: Filter },
  { id: "predict", label: "AI Prediction", icon: Brain },
  { id: "metrics", label: "Model Metrics", icon: BarChart3 },
  { id: "method", label: "Methodology", icon: BookOpen },
];

export function Sidebar({ active, onChange, data }: { active: Step; onChange: (s: Step) => void; data: AnalyzeResult | null }) {
  return (
    <aside className="w-14 sm:w-44 lg:w-60 shrink-0 border-r border-border bg-panel min-h-[calc(100vh-3.5rem)] p-2 sm:p-3 lg:p-4 flex flex-col gap-6">
      <div>
        <div className="hidden sm:block font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">PIPELINE</div>
        <nav className="flex flex-col gap-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange(s.id)}
                title={s.label}
                className={cn(
                  "flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 rounded text-xs lg:text-sm transition-all border",
                  isActive
                    ? "bg-cyan_q/10 text-cyan-q border-cyan-q glow-cyan"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-panel-elevated"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      {data && (
        <div className="mt-auto hidden sm:block border border-border rounded p-3 bg-panel-elevated">
          <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-2">ACTIVE TICKER</div>
          <div className="font-mono text-cyan-q text-base">{data.meta.symbol}</div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase">{data.meta.name}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1">{data.meta.tradingDays} trading days</div>
          <div className="font-mono text-[11px] text-muted-foreground">{data.meta.exchange}</div>
          <div className="font-mono text-[11px] text-bull mt-2">✓ Yahoo Finance live</div>
        </div>
      )}
    </aside>
  );
}