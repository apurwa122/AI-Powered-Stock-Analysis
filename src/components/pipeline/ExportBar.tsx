import { Download, FileText, Table as TableIcon, Bell, BellOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalyzeResult } from "@/lib/symbols";
import { toast } from "sonner";
import { useEffect, useState } from "react";

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(data: AnalyzeResult): string {
  const { dates, open, high, low, close, volume } = data.ohlcv;
  const f = data.filters;
  const head = ["date","open","high","low","close","volume","ma","butter","kalman","savgol","median"];
  const rows = dates.map((d,i) => [d, open[i], high[i], low[i], close[i], volume[i], f.ma[i], f.butter[i], f.kalman[i], f.savgol[i], f.median[i]].join(","));
  let csv = head.join(",") + "\n" + rows.join("\n");
  csv += "\n\n# FORECAST\ndate,ensemble,upper,lower,linear,ridge,mlp,arima\n";
  csv += data.forecast.dates.map((d,i) => [d, data.forecast.ensemble[i], data.forecast.upper[i], data.forecast.lower[i], data.forecast.linear[i], data.forecast.ridge[i], data.forecast.mlp[i], data.forecast.arima[i]].join(",")).join("\n");
  return csv;
}

function toReport(data: AnalyzeResult): string {
  const m = data.metrics;
  const r = data.recommendation;
  const p = data.price;
  return `MINOR PROJECT · QUANT REPORT
================================
Symbol: ${data.meta.symbol} (${data.meta.name})
Exchange: ${data.meta.exchange}   Currency: ${data.meta.currency}
Trading days: ${data.meta.tradingDays}

PRICE
-----
Current : ${p.current.toFixed(2)}
Today % : ${p.todayChg.toFixed(2)}
1Y %    : ${p.oneYearChg.toFixed(2)}
52W H/L : ${p.high52w.toFixed(2)} / ${p.low52w.toFixed(2)}
Ann Vol : ${p.annVol.toFixed(2)}%

RECOMMENDATION
--------------
Action     : ${r.action}
Target     : ${r.target.toFixed(2)} (${r.expectedMove.toFixed(2)}%)
Confidence : ${r.confidence.toFixed(2)}%
Horizon    : ${data.forecast.horizon} days

MODEL METRICS (20% holdout)
---------------------------
${Object.entries(m).map(([k,v]) => `${k.padEnd(10)} acc=${v.accuracy.toFixed(2)}  rmse=${v.rmse.toFixed(4)}  mape=${v.mape.toFixed(2)}  r2=${v.r2.toFixed(3)}  dir=${v.direction.toFixed(2)}%`).join("\n")}

${data.walkForward ? `WALK-FORWARD BACKTEST
---------------------
Window: ${data.walkForward.window}d  Step: ${data.walkForward.step}d  N: ${data.walkForward.actual.length}
Acc=${data.walkForward.metrics.accuracy.toFixed(2)}  RMSE=${data.walkForward.metrics.rmse.toFixed(4)}  Dir=${data.walkForward.metrics.direction.toFixed(2)}%
` : ""}
FILTER STATS (SNR · noise reduction)
${Object.entries(data.filterStats).map(([k,v]) => `  ${k.padEnd(8)} snr=${v.snr.toFixed(2)}dB  noiseCut=${v.noiseCut.toFixed(2)}%  rmse=${v.rmse.toFixed(4)}`).join("\n")}

AI INSIGHT
----------
${data.aiInsight || "(unavailable)"}
`;
}

export function ExportBar({
  data, onRun, loading, live, setLive, interval, setInterval: setIv, alertPct, setAlertPct, lastUpdated,
}: {
  data: AnalyzeResult | null;
  onRun: () => void;
  loading: boolean;
  live: boolean; setLive: (v: boolean) => void;
  interval: number; setInterval: (v: number) => void;
  alertPct: number; setAlertPct: (v: number) => void;
  lastUpdated: number | null;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const ago = lastUpdated ? Math.max(0, Math.floor((now - lastUpdated) / 1000)) : null;

  return (
    <div className="border-b border-border bg-panel px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLive(!live)}
          className={`h-8 font-mono text-[11px] border-border ${live ? "border-bull text-bull bg-bull/5" : "text-muted-foreground"}`}
        >
          {live ? <Bell className="w-3 h-3 mr-1.5" /> : <BellOff className="w-3 h-3 mr-1.5" />}
          {live ? "LIVE ON" : "LIVE OFF"}
        </Button>
        <span className="font-mono text-[10px] text-muted-foreground">every</span>
        <Input
          type="number" min={10} max={3600}
          value={interval}
          onChange={(e) => setIv(Math.max(10, Number(e.target.value) || 60))}
          className="w-16 h-8 font-mono text-[11px] bg-panel-elevated border-border"
        />
        <span className="font-mono text-[10px] text-muted-foreground">s · alert ±</span>
        <Input
          type="number" min={0.1} step={0.1} max={50}
          value={alertPct}
          onChange={(e) => setAlertPct(Math.max(0.1, Number(e.target.value) || 1))}
          className="w-14 h-8 font-mono text-[11px] bg-panel-elevated border-border"
        />
        <span className="font-mono text-[10px] text-muted-foreground">%</span>
        {lastUpdated && (
          <span className="font-mono text-[10px] text-muted-foreground ml-2 flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-cyan-q" : ""}`} />
            updated {ago}s ago
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="sm" disabled={!data}
          onClick={() => data && downloadFile(`${data.meta.symbol}_data.csv`, toCSV(data), "text/csv")}
          className="h-8 font-mono text-[11px] border-border"
        >
          <TableIcon className="w-3 h-3 mr-1.5" /> EXPORT CSV
        </Button>
        <Button
          variant="outline" size="sm" disabled={!data}
          onClick={() => data && downloadFile(`${data.meta.symbol}_analysis.json`, JSON.stringify(data, null, 2), "application/json")}
          className="h-8 font-mono text-[11px] border-border"
        >
          <Download className="w-3 h-3 mr-1.5" /> EXPORT JSON
        </Button>
        <Button
          variant="outline" size="sm" disabled={!data}
          onClick={() => {
            if (!data) return;
            downloadFile(`${data.meta.symbol}_report.txt`, toReport(data), "text/plain");
            toast.success("Report downloaded");
          }}
          className="h-8 font-mono text-[11px] border-cyan-q text-cyan-q"
        >
          <FileText className="w-3 h-3 mr-1.5" /> REPORT
        </Button>
      </div>
    </div>
  );
}
