import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyzeResult } from "@/lib/symbols";
import { fmtNum } from "@/lib/symbols";

const MODEL_META = [
  { key: "linear", name: "Linear Regression", color: "hsl(var(--neutral))" },
  { key: "ridge", name: "Ridge (Lag Features)", color: "hsl(var(--cyan))" },
  { key: "mlp", name: "LSTM-Style MLP", color: "hsl(var(--purple))" },
  { key: "arima", name: "ARIMA (5,1,0)", color: "hsl(var(--amber))" },
  { key: "ensemble", name: "Ensemble (Average)", color: "hsl(var(--bull))" },
] as const;

export function ModelMetrics({ data }: { data: AnalyzeResult }) {
  const accData = MODEL_META.map((m) => ({ name: m.name, value: data.metrics[m.key].accuracy, color: m.color }));
  const dirData = MODEL_META.map((m) => ({ name: m.name, value: data.metrics[m.key].direction, color: m.color }));
  const bestKey = MODEL_META.reduce((best, m) => data.metrics[m.key].accuracy > data.metrics[best.key].accuracy ? m : best, MODEL_META[0]).key;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="PRICE ACCURACY % (100 - MAPE)" data={accData} />
        <ChartCard title="DIRECTIONAL ACCURACY % (UP/DOWN CORRECTNESS)" data={dirData} />
      </div>

      <div className="border border-border rounded bg-panel p-5">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
          FULL METRICS TABLE · 20% HOLDOUT TEST SET
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2.5 px-2">Model</th>
                <th className="text-right">Acc %</th>
                <th className="text-right">RMSE</th>
                <th className="text-right">MAPE %</th>
                <th className="text-right">R²</th>
                <th className="text-right">Direction %</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_META.map((m) => {
                const M = data.metrics[m.key];
                const isBest = m.key === bestKey;
                return (
                  <tr key={m.key} className={`border-b border-border/40 ${isBest ? "bg-bull/5" : ""}`}>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: m.color }} />
                      <span style={{ color: m.color }}>{m.name}</span>
                      {isBest && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-bull/20 text-bull">BEST</span>}
                    </td>
                    <td className="text-right text-bull">{fmtNum(M.accuracy)}</td>
                    <td className="text-right">{fmtNum(M.rmse, 4)}</td>
                    <td className="text-right">{fmtNum(M.mape, 4)}</td>
                    <td className="text-right">{fmtNum(M.r2, 4)}</td>
                    <td className="text-right text-cyan-q">{fmtNum(M.direction)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-cyan-q/30 rounded bg-cyan_q/5 px-4 py-3 text-sm text-foreground/80">
        <span className="text-cyan-q font-semibold">Reading the numbers:</span> Accuracy = 100 − MAPE (price level). RMSE is absolute error in currency units. R² close to 1 = better fit. Directional % = frequency model predicts correct sign of next-day move — the most honest metric for trading.
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="border border-border rounded bg-panel p-5">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
          <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}