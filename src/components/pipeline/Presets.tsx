import { Layers } from "lucide-react";
import { PRESETS, SYMBOLS } from "@/lib/symbols";
import { cn } from "@/lib/utils";

export function Presets({ active, onPick }: { active: string; onPick: (sym: string) => void }) {
  return (
    <div className="border-b border-border bg-panel-elevated px-6 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          <Layers className="w-3.5 h-3.5 text-cyan-q" /> PRESETS
        </div>
        {PRESETS.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-purple-q">{p.label}:</span>
            {p.symbols.map((s) => {
              const meta = SYMBOLS.find((x) => x.value === s);
              const lbl = meta ? meta.label.split(" ")[0] : s;
              const isActive = active === s;
              return (
                <button
                  key={s}
                  onClick={() => onPick(s)}
                  title={meta?.label || s}
                  className={cn(
                    "font-mono text-[10px] px-2 py-1 rounded border transition-all",
                    isActive
                      ? "border-cyan-q text-cyan-q bg-cyan_q/10 glow-cyan"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-cyan-q/50"
                  )}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
