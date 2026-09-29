import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyzeResult } from "@/lib/symbols";
import { currencySymbol, fmtNum } from "@/lib/symbols";

export function AIPrediction({ data }: { data: AnalyzeResult }) {
  const cs = currencySymbol(data.meta.currency);
  const ensembleAcc = data.metrics.ensemble.accuracy;

  // Combined chart: last 90 days history + forecast
  const histN = Math.min(90, data.ohlcv.dates.length);
  const histStart = data.ohlcv.dates.length - histN;
  const history = Array.from({ length: histN }, (_, i) => ({
    date: data.ohlcv.dates[histStart + i],
    history: data.ohlcv.close[histStart + i],
  }));
  const forecast = data.forecast.dates.map((d, i) => ({
    date: d,
    forecast: data.forecast.ensemble[i],
    upper: data.forecast.upper[i],
    lower: data.forecast.lower[i],
    band: [data.forecast.lower[i], data.forecast.upper[i]],
  }));
  const combined = [...history, ...forecast];

  const breakdown = data.forecast.dates.map((d, i) => ({
    date: d,
    ensemble: data.forecast.ensemble[i],
    linear: data.forecast.linear[i],
    ridge: data.forecast.ridge[i],
    mlp: data.forecast.mlp[i],
    arima: data.forecast.arima[i],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="HORIZON" value={`${data.forecast.horizon} days`} color="text-cyan-q" border="border-cyan-q" />
        <Tile label="ENSEMBLE ACC." value={`${ensembleAcc.toFixed(2)}%`} color="text-bull" border="border-bull" sub="100 - MAPE" />
        <Tile label="MODELS" value="5" color="text-purple-q" border="border-purple-q" sub="Linear + Ridge + MLP + ARIMA + Ensemble" />
        <Tile label="FORECAST END" value={`${cs}${fmtNum(data.recommendation.target)}`} color="text-amber-q" border="border-amber-q" />
      </div>

      <div className="border border-border rounded bg-panel p-5">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
          ENSEMBLE FORECAST · 95% CONFIDENCE BAND · {data.forecast.horizon}-DAY HORIZON
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combined}>
            <defs>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--bull))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--bull))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} minTickGap={50} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
            <Area dataKey="band" stroke="none" fill="url(#bandGrad)" name="95% CI" />
            <Line type="monotone" dataKey="history" stroke="hsl(var(--cyan))" strokeWidth={1.5} dot={false} name="Historical" />
            <Line type="monotone" dataKey="forecast" stroke="hsl(var(--bull))" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-border rounded bg-panel p-5">
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
          PER-MODEL FORECAST BREAKDOWN · 4 MODELS + ENSEMBLE
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={breakdown}>
            <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} minTickGap={40} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
            <Line type="monotone" dataKey="linear" stroke="hsl(var(--neutral))" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Linear" />
            <Line type="monotone" dataKey="ridge" stroke="hsl(var(--cyan))" strokeWidth={1} dot={false} name="Ridge" />
            <Line type="monotone" dataKey="mlp" stroke="hsl(var(--purple))" strokeWidth={1} strokeDasharray="4 2" dot={false} name="MLP" />
            <Line type="monotone" dataKey="arima" stroke="hsl(var(--amber))" strokeWidth={1} dot={false} name="ARIMA" />
            <Line type="monotone" dataKey="ensemble" stroke="hsl(var(--bull))" strokeWidth={2.5} dot={false} name="Ensemble" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Tile({ label, value, color, border, sub }: { label: string; value: string; color: string; border: string; sub?: string }) {
  return (
    <div className={`rounded border ${border} bg-panel p-4`}>
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`font-mono text-2xl mt-2 ${color}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}