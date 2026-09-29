const SECTIONS = [
  { num: "1.", title: "DATA PIPELINE", color: "border-cyan-q text-cyan-q", body: "yfinance pulls 2 years of daily OHLCV from Yahoo Finance. Data is auto-adjusted for splits/dividends. Dropped rows: NaN closes. Output: ~500 trading days per ticker." },
  { num: "2.", title: "ECE FILTERS", color: "border-amber-q text-amber-q", body: "5 classical DSP filters applied to the close series — Moving Average (FIR w=20), Butterworth 4th-order IIR low-pass (fc=0.05), Kalman (constant-velocity state), Savitzky-Golay (poly=3, w=21), Median (kernel=11). Each reports SNR, noise reduction %, and RMSE vs raw." },
  { num: "3.", title: "ML ENSEMBLE", color: "border-purple-q text-purple-q", body: "4 models trained on 80% of Savitzky-Golay smoothed prices. Linear Regression (trend), Ridge with 20-day lag features, MLP (64→32 ReLU, early-stopping), ARIMA(5,1,0). Recursive forecasting for horizon, clipped to [0.5x, 2x] of current price. Ensemble = mean." },
  { num: "4.", title: "METRICS", color: "border-bull text-bull", body: "Held-out 20% test set. Reports RMSE, MAPE, R², accuracy % (100−MAPE), directional accuracy %. 95% confidence band = 1.96 × inter-model std on future predictions." },
  { num: "5.", title: "RECOMMENDATION", color: "border-cyan-q text-cyan-q", body: "Compares current price to ensemble forecast endpoint. >+3% → BUY, <−3% → SELL, else HOLD. Confidence scales with |expected move|, capped at 99%. Target price = ensemble prediction at horizon end." },
  { num: "", title: "DISCLAIMER", color: "border-bear text-bear", body: "This is an educational ECE + ML project. No model can reliably predict stock direction >95%. Real markets are near-efficient — use these numbers for learning DSP/ML pipelines, never as sole trading input." },
];

export function Methodology() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SECTIONS.map((s, i) => (
        <div key={i} className={`rounded border ${s.color.split(" ")[0]} bg-panel p-5`}>
          <div className={`font-mono text-sm font-bold ${s.color.split(" ")[1]} mb-2`}>
            {s.num} {s.title}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}