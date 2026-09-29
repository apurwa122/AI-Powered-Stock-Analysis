import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TopBar } from "@/components/pipeline/TopBar";
import { Sidebar, type Step } from "@/components/pipeline/Sidebar";
import { StepShell } from "@/components/pipeline/StepShell";
import { DataOverview } from "@/components/pipeline/DataOverview";
import { FilterLab } from "@/components/pipeline/FilterLab";
import { AIPrediction } from "@/components/pipeline/AIPrediction";
import { ModelMetrics } from "@/components/pipeline/ModelMetrics";
import { Methodology } from "@/components/pipeline/Methodology";
import { ExportBar } from "@/components/pipeline/ExportBar";
import type { AnalyzeResult } from "@/lib/symbols";

const STEP_ORDER: Step[] = ["data", "filter", "predict", "metrics", "method"];
const STEP_TITLES: Record<Step, string> = {
  data: "Data Overview",
  filter: "Filter Lab",
  predict: "AI Prediction",
  metrics: "Model Metrics",
  method: "Methodology",
};

const Index = () => {
  const [symbol, setSymbol] = useState("^NSEI");
  const [custom, setCustom] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [step, setStep] = useState<Step>("data");
  const [data, setData] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [intervalSec, setIntervalSec] = useState(60);
  const [alertPct, setAlertPct] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const run = async () => {
    const sym = (custom.trim() || symbol).trim();
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("analyze", {
        body: { symbol: sym, horizon },
      });
      if (err) throw err;
      if (res && typeof res === "object" && "error" in res && typeof res.error === "string") {
        throw new Error(res.error);
      }
      const r = res as AnalyzeResult;
      // Price-move alert
      if (lastPrice != null && r.price?.current) {
        const chg = ((r.price.current - lastPrice) / lastPrice) * 100;
        if (Math.abs(chg) >= alertPct) {
          const dir = chg >= 0 ? "▲" : "▼";
          (chg >= 0 ? toast.success : toast.error)(
            `${dir} ${r.meta.symbol} moved ${chg.toFixed(2)}% (alert ±${alertPct}%)`
          );
        }
      }
      setLastPrice(r.price.current);
      setLastUpdated(Date.now());
      setData(r);
      toast.success(`Pipeline complete · ${r.meta.symbol}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on first load
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run on symbol/horizon change (after first load)
  useEffect(() => {
    if (!data) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, horizon]);

  // Live polling
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      if (!loading) run();
    }, Math.max(10, intervalSec) * 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, intervalSec, symbol, horizon, custom, alertPct, lastPrice]);

  const stepIdx = STEP_ORDER.indexOf(step);
  const onPrev = stepIdx > 0 ? () => setStep(STEP_ORDER[stepIdx - 1]) : undefined;
  const onNext = stepIdx < STEP_ORDER.length - 1 ? () => setStep(STEP_ORDER[stepIdx + 1]) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground scanline">
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <h1 className="font-mono text-xl sm:text-2xl tracking-tight">
          Financial <span className="text-cyan-q">Signal</span> Processing & <span className="text-purple-q">AI</span> Predictor
        </h1>
      </div>
      <TopBar
        symbol={symbol} setSymbol={(v) => { setSymbol(v); setCustom(""); }}
        custom={custom} setCustom={setCustom}
        horizon={horizon} setHorizon={setHorizon}
        onRun={run} loading={loading}
      />
      <ExportBar
        data={data} onRun={run} loading={loading}
        live={live} setLive={setLive}
        interval={intervalSec} setInterval={setIntervalSec}
        alertPct={alertPct} setAlertPct={setAlertPct}
        lastUpdated={lastUpdated}
      />
      <div className="flex">
        <Sidebar active={step} onChange={setStep} data={data} />
        <main className="flex-1 min-w-0">
          {loading && !data && (
            <div className="flex items-center justify-center h-[60vh] gap-3 text-cyan-q font-mono text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Fetching market data · running DSP pipeline · training ML ensemble…
            </div>
          )}
          {error && !data && (
            <div className="m-6 border border-bear rounded bg-bear/5 p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-bear shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-sm text-bear">PIPELINE ERROR</div>
                <div className="text-sm text-foreground/80 mt-1">{error}</div>
              </div>
            </div>
          )}
          {data && (
            <StepShell stepNum={stepIdx + 1} totalSteps={STEP_ORDER.length} title={STEP_TITLES[step]} onPrev={onPrev} onNext={onNext}>
              {step === "data" && <DataOverview data={data} />}
              {step === "filter" && <FilterLab data={data} />}
              {step === "predict" && <AIPrediction data={data} />}
              {step === "metrics" && <ModelMetrics data={data} />}
              {step === "method" && <Methodology />}
            </StepShell>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
