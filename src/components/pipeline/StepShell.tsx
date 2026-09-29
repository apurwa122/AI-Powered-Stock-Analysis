import { Button } from "@/components/ui/button";

export function StepShell({
  stepNum, totalSteps, title, children, onPrev, onNext,
}: {
  stepNum: number; totalSteps: number; title: string; children: React.ReactNode;
  onPrev?: () => void; onNext?: () => void;
}) {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
          STEP {stepNum}/{totalSteps}
        </span>
        <span className="text-muted-foreground">|</span>
        <h2 className="font-mono text-lg text-foreground">{title}</h2>
      </div>
      {children}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onPrev} disabled={!onPrev} className="font-mono text-xs h-9 border-border bg-panel-elevated">
          ← PREV
        </Button>
        <Button variant="outline" onClick={onNext} disabled={!onNext} className="font-mono text-xs h-9 border-cyan-q text-cyan-q bg-panel-elevated">
          NEXT →
        </Button>
      </div>
    </div>
  );
}