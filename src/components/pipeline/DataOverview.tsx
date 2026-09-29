import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyzeResult } from "@/lib/symbols";
import { currencySymbol, fmtNum, fmtCompact } from "@/lib/symbols";

export function DataOverview({ data }: { data: AnalyzeResult }) {
  const cs = currencySymbol(data.meta.currency);
  const chartData = data.ohlcv.dates.map((d, i) => ({ date: d, close: data.ohlcv.close[i] }));
  const tableRows = data.ohlcv.dates.map((d, i) => ({
    date: d,
    open: data.ohlcv.open[i],
    high: data.ohlcv.high[i],
    low: data.ohlcv.low[i],
    close: data.ohlcv.close[i],
    volume: data.ohlcv.volume[i],
  })).slice(-50).reverse();

  const chgColor = data.price.todayChg >= 0 ? "text-bull" : "text-bear";
  const yrColor = data.price.oneYearChg >= 0 ? "text-bull" : "text-bear";

  return (
    <div className="space-y-6">
      {/* Top metrics bar */}
      <div className="border border-border rounded bg-panel p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Stat label={`PRICE · ${data.meta.symbol}`} value={`${cs}${fmtCompact(data.price.current)}`} sub={`${data.price.todayChg >= 0 ? "+" : ""}${data.price.todayChg.toFixed(2)}% today`} color={chgColor} />
          <Stat label="52W HIGH" value={`${cs}${fmtCompact(data.price.high52w)}`} color="text-bull" />
          <Stat label="52W LOW" value={`${cs}${fmtCompact(data.price.low52w)}`} color="text-bear" />
          <Stat label="1Y CHG" value={`${data.price.oneYearChg >= 0 ? "+" : ""}${data.price.oneYearChg.toFixed(2)}%`} color={yrColor} />
          <Stat label="VOL (ann.)" value={`${data.price.annVol.toFixed(2)}%`} color="text-amber-q" />
          <Stat label="AVG VOL" value={fmtCompact(data.price.avgVol)} color="text-cyan-q" />
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="border border-cyan-q rounded bg-panel p-4 sm:p-5 glow-cyan">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">AI RECOMMENDATION</div>
            <div className={`font-mono text-3xl sm:text-4xl mt-2 ${
              data.recommendation.action === "BUY" ? "text-bull" :
              data.recommendation.action === "SELL" ? "text-bear" : "text-cyan-q"
            }`}>{data.recommendation.action}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground break-words">
              TARGET ({data.recommendation.expectedMove >= 0 ? "+" : ""}{data.recommendation.expectedMove.toFixed(2)}%)
            </div>
            <div className="font-mono text-xl sm:text-2xl mt-2 text-foreground break-all">{cs}{fmtNum(data.recommendation.target)}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">CONFIDENCE</div>
            <div className="font-mono text-xl sm:text-2xl mt-2 text-purple-q">{data.recommendation.confidence.toFixed(2)}%</div>
          </div>
        </div>
        {data.aiInsight && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="font-mono text-[10px] tracking-[0.2em] text-purple-q mb-1.5">⚡ AI · QUANT INSIGHT</div>
            <div className="text-sm text-foreground/90 leading-relaxed">{data.aiInsight}</div>
          </div>
        )}
      </div>

      {/* Chart / Table tabs */}
      <div className="border border-border rounded bg-panel">
        <Tabs defaultValue="chart">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger value="chart" className="font-mono text-xs rounded-none data-[state=active]:bg-transparent data-[state=active]:text-cyan-q data-[state=active]:border-b-2 data-[state=active]:border-cyan-q px-5 py-3">PRICE CHART</TabsTrigger>
            <TabsTrigger value="table" className="font-mono text-xs rounded-none data-[state=active]:bg-transparent data-[state=active]:text-cyan-q data-[state=active]:border-b-2 data-[state=active]:border-cyan-q px-5 py-3">OHLCV TABLE</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="p-5 mt-0">
            <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-3">
              CLOSING PRICE · 2 YEARS · {data.meta.tradingDays} TRADING DAYS
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--cyan))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--cyan))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--grid))" strokeDasharray="2 4" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} minTickGap={50} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "hsl(var(--panel-elevated))", border: "1px solid hsl(var(--border))", fontFamily: "Space Mono", fontSize: 11 }} />
                <Area type="monotone" dataKey="close" stroke="hsl(var(--cyan))" strokeWidth={1.5} fill="url(#cyanGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="table" className="p-5 mt-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full font-mono text-xs">
                <thead className="text-muted-foreground border-b border-border sticky top-0 bg-panel">
                  <tr><th className="text-left py-2 px-2">DATE</th><th className="text-right py-2 px-2">OPEN</th><th className="text-right">HIGH</th><th className="text-right">LOW</th><th className="text-right">CLOSE</th><th className="text-right">VOLUME</th></tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.date} className="border-b border-border/50">
                      <td className="py-1.5 px-2 text-muted-foreground">{r.date}</td>
                      <td className="text-right">{fmtNum(r.open)}</td>
                      <td className="text-right text-bull">{fmtNum(r.high)}</td>
                      <td className="text-right text-bear">{fmtNum(r.low)}</td>
                      <td className="text-right text-cyan-q">{fmtNum(r.close)}</td>
                      <td className="text-right text-muted-foreground">{fmtCompact(r.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border border-cyan-q/30 rounded bg-cyan_q/5 px-4 py-3 text-sm text-foreground/80">
        <span className="text-cyan-q font-semibold">Note:</span> Raw closing prices are non-stationary (drift + volatility clustering). The ECE filters in the next step smooth this noisy signal before ML forecasting.
      </div>
    </div>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground truncate">{label}</div>
      <div className={`font-mono text-base sm:text-lg mt-1 truncate ${color}`} title={value}>{value}</div>
      {sub && <div className={`font-mono text-[10px] mt-0.5 truncate ${color}`}>{sub}</div>}
    </div>
  );
}