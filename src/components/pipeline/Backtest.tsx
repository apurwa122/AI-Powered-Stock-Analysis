import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyzeResult } from "@/lib/symbols";
import { fmtNum } from "@/lib/symbols";

export function Backtest({ data }: { data: AnalyzeResult }) {
  const wf = data.walkForward;
  if (!wf) {
    return (
      <div className="border border-border rounded bg-panel p-6 font-mono text-sm text-muted-foreground">
        Not enough history to run a walk-forward backtest for this symbol.
      </div>
    );
  }
  const chart = wf.dates.map((d, i) => ({ date: d, actual: wf.actual[i], predicted: wf.predicted[i] }));
  const errors = wf.actual.map((a, i) => Math.abs(a - wf.predicted[i]));
  const maxErr = Math.max(...errors);
  const m = wf.metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Tile label="STRATEGY" value="Walk-Forward" sub={`${wf.step}-day step`} color="text-cyan-q" />
        <Tile label="TRAIN WINDOW" value={`${wf.window}d`} sub="rolling refit" color="text-purple-q" />
        <Tile label="OUT-OF-SAMPLE ACC." value={`${m.accuracy.toFixed(2)}%`} sub="100 - MAPE" color="text-bull" />
        <Tile label="DIRECTIONAL" value={`${m.direction.toFixed(2)}%`} sub="up/down hits" color="text-amber-q" />
        <Tile label="RMSE" value={fmtNum(m.rmse, 4)} sub={`R² ${m.r2.toFixed(3)}`} color="text-foreground" />
      </div>

      <div className="border border-border rounded bg-panel p-5">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
          WALK-FORWARD: ROLLING-REFIT ENSEMBLE vs ACTUAL CLOSE
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chart}>
            <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} minTickGap={50} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--cyan))" strokeWidth={1.5} dot={false} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="hsl(var(--bull))" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Predicted (rolling)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-cyan-q/30 rounded bg-cyan_q/5 px-4 py-3 text-sm text-foreground/80">
        <span className="text-cyan-q font-semibold">Walk-forward</span> refits the ensemble every {wf.step} days on the most recent {wf.window}-day window and predicts the next {wf.step} days. This avoids look-ahead bias and gives a realistic out-of-sample estimate. Max abs error in window: <span className="font-mono text-amber-q">{fmtNum(maxErr, 2)}</span>.
      </div>
    </div>
  );
}

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded border border-border bg-panel p-4">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`font-mono text-xl mt-2 ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
