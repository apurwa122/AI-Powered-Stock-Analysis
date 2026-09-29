import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyzeResult } from "@/lib/symbols";
import { fmtNum } from "@/lib/symbols";

const FILTER_META = [
  { key: "ma", name: "Moving Average (w=20)", color: "hsl(var(--cyan))", desc: "Simple 20-day rolling mean — classic low-pass smoother that removes daily noise.", border: "border-cyan-q" },
  { key: "butter", name: "Butterworth Low-pass", color: "hsl(var(--bull))", desc: "4th-order digital Butterworth filter (cutoff=0.05). Flat passband, sharp roll-off.", border: "border-bull" },
  { key: "kalman", name: "Kalman Filter", color: "hsl(var(--amber))", desc: "Optimal recursive estimator with constant-velocity state model. Excellent for noisy, trending signals.", border: "border-amber-q" },
  { key: "median", name: "Median Filter", color: "hsl(var(--bear))", desc: "Non-linear 11-sample median — robustly removes spikes and outliers without blurring edges.", border: "border-bear" },
] as const;

export function FilterLab({ data }: { data: AnalyzeResult }) {
  // Last 150 days for visualization
  const N = Math.min(150, data.ohlcv.dates.length);
  const start = data.ohlcv.dates.length - N;
  const chartData = Array.from({ length: N }, (_, i) => {
    const idx = start + i;
    return {
      date: data.ohlcv.dates[idx],
      raw: data.ohlcv.close[idx],
      ma: data.filters.ma[idx],
      butter: data.filters.butter[idx],
      kalman: data.filters.kalman[idx],
      median: data.filters.median[idx],
    };
  });

  return (
    <div className="space-y-6">
      <div className="border border-border rounded bg-panel p-5">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
          ECE FILTER COMPARISON · LAST {N} DAYS · RAW (GRAY) VS 5 FILTERS
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} minTickGap={50} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
            <Line type="monotone" dataKey="raw" stroke="hsl(var(--neutral))" strokeWidth={1} dot={false} name="Raw" />
            <Line type="monotone" dataKey="ma" stroke="hsl(var(--cyan))" strokeWidth={1.5} dot={false} name="MA" />
            <Line type="monotone" dataKey="butter" stroke="hsl(var(--bull))" strokeWidth={1.5} dot={false} name="Butterworth" />
            <Line type="monotone" dataKey="kalman" stroke="hsl(var(--amber))" strokeWidth={1.5} dot={false} name="Kalman" />
            <Line type="monotone" dataKey="median" stroke="hsl(var(--bear))" strokeWidth={1.5} dot={false} name="Median" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FILTER_META.map((f) => {
          const stats = data.filterStats[f.key];
          return (
            <div key={f.key} className={`rounded border ${f.border} bg-panel p-4 space-y-3`}>
              <div>
                <div className="font-mono text-sm font-bold" style={{ color: f.color }}>{f.name}</div>
              </div>
              <p className="text-[12px] text-foreground/75 leading-relaxed">{f.desc}</p>
              <div className="space-y-1.5 pt-2 border-t border-border/50 font-mono text-[11px]">
                <Row label="SNR" value={`${fmtNum(stats.snr)} dB`} />
                <Row label="Noise cut" value={`${fmtNum(stats.noiseCut)}%`} />
                <Row label="RMSE" value={fmtNum(stats.rmse, 4)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-cyan-q/30 rounded bg-cyan_q/5 px-4 py-3 text-sm text-foreground/80">
        <span className="text-cyan-q font-semibold">Design Insight:</span> Kalman is optimal under Gaussian assumptions (minimal lag). Butterworth gives flat passband but introduces phase distortion. Median robustly kills spike-outliers. Moving Average is the classical baseline.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}