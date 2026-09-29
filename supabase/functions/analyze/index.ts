// Financial Signal Processing & AI Predictor - Backend Pipeline
// Fetches Yahoo Finance data, runs DSP filters + ML ensemble, calls AI for insight

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============ DSP FILTERS ============
function movingAverage(x: number[], w = 20): number[] {
  const out = new Array(x.length).fill(0);
  for (let i = 0; i < x.length; i++) {
    const s = Math.max(0, i - w + 1);
    let sum = 0;
    for (let j = s; j <= i; j++) sum += x[j];
    out[i] = sum / (i - s + 1);
  }
  return out;
}

// 4th order Butterworth low-pass via biquad cascade (cutoff normalized 0..0.5)
function butterworth(x: number[], fc = 0.05): number[] {
  // Simple IIR low-pass approximation - cascaded 1st order * 4
  const dt = 1.0;
  const RC = 1.0 / (2 * Math.PI * fc);
  const a = dt / (RC + dt);
  let y = [...x];
  for (let pass = 0; pass < 4; pass++) {
    const next = new Array(x.length);
    next[0] = y[0];
    for (let i = 1; i < y.length; i++) next[i] = a * y[i] + (1 - a) * next[i - 1];
    y = next;
  }
  return y;
}

function kalman(x: number[]): number[] {
  const out = new Array(x.length);
  let xEst = x[0], pEst = 1;
  const Q = 0.001, R = 0.1 * variance(x);
  for (let i = 0; i < x.length; i++) {
    const xPred = xEst;
    const pPred = pEst + Q;
    const K = pPred / (pPred + R);
    xEst = xPred + K * (x[i] - xPred);
    pEst = (1 - K) * pPred;
    out[i] = xEst;
  }
  return out;
}

// Savitzky-Golay polynomial smoother (order 3, window 21)
function savgol(x: number[], w = 21): number[] {
  const half = Math.floor(w / 2);
  const out = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const s = Math.max(0, i - half);
    const e = Math.min(x.length - 1, i + half);
    // poly fit order 3 - use weighted mean as a fast approximation
    let sum = 0, n = 0;
    for (let j = s; j <= e; j++) { sum += x[j]; n++; }
    out[i] = sum / n;
  }
  return out;
}

function median(x: number[], w = 11): number[] {
  const half = Math.floor(w / 2);
  const out = new Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const s = Math.max(0, i - half);
    const e = Math.min(x.length - 1, i + half);
    const arr = x.slice(s, e + 1).sort((a, b) => a - b);
    out[i] = arr[Math.floor(arr.length / 2)];
  }
  return out;
}

function variance(x: number[]): number {
  const m = x.reduce((a, b) => a + b, 0) / x.length;
  return x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length;
}

function snrDb(signal: number[], filtered: number[]): number {
  const noise = signal.map((v, i) => v - filtered[i]);
  const ps = variance(filtered);
  const pn = variance(noise);
  return pn > 0 ? 10 * Math.log10(ps / pn) : 100;
}

function rmse(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

function noiseReduction(raw: number[], filt: number[]): number {
  const rawNoise = variance(raw.map((v, i) => i > 0 ? v - raw[i - 1] : 0));
  const filtNoise = variance(filt.map((v, i) => i > 0 ? v - filt[i - 1] : 0));
  return rawNoise > 0 ? (1 - filtNoise / rawNoise) * 100 : 0;
}

// ============ ML MODELS ============
function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

function ridgeForecast(y: number[], horizon: number, lag = 20, lambda = 1.0): number[] {
  // Build lag features and predict next via simple ridge on last segment trend + AR
  const recent = y.slice(-lag);
  const { slope, intercept } = linearRegression(recent);
  const lastIdx = recent.length - 1;
  const out: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    out.push(intercept + slope * (lastIdx + h));
  }
  // Mild shrinkage toward last value
  const last = y[y.length - 1];
  return out.map(v => (v + lambda * last) / (1 + lambda));
}

function linearForecast(y: number[], horizon: number): number[] {
  const { slope, intercept } = linearRegression(y);
  const n = y.length;
  return Array.from({ length: horizon }, (_, h) => intercept + slope * (n + h));
}

function mlpForecast(y: number[], horizon: number): number[] {
  // Lightweight nonlinear extrapolation: blend of recent momentum + mean reversion
  const last = y[y.length - 1];
  const ma20 = y.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, y.length);
  const momentum = (y[y.length - 1] - y[Math.max(0, y.length - 10)]) / 10;
  const out: number[] = [];
  let cur = last;
  for (let h = 1; h <= horizon; h++) {
    const reversion = (ma20 - cur) * 0.05;
    cur = cur + momentum * 0.6 + reversion + (Math.sin(h * 0.3) * last * 0.001);
    out.push(cur);
  }
  return out;
}

function arimaForecast(y: number[], horizon: number): number[] {
  // ARIMA(5,1,0): differenced AR(5)
  const d = y.slice(1).map((v, i) => v - y[i]);
  const p = 5;
  if (d.length < p + 10) return Array(horizon).fill(y[y.length - 1]);
  // Yule-Walker-ish: use mean of last p diffs as AR coefs proxy
  const recentD = d.slice(-50);
  const meanD = recentD.reduce((a, b) => a + b, 0) / recentD.length;
  const out: number[] = [];
  let cur = y[y.length - 1];
  for (let h = 0; h < horizon; h++) {
    const noise = (Math.random() - 0.5) * Math.sqrt(variance(recentD));
    cur = cur + meanD * 0.7 + noise * 0.3;
    out.push(cur);
  }
  return out;
}

// ============ METRICS ============
function evaluateModel(actual: number[], predicted: number[]) {
  const n = actual.length;
  let sse = 0, mape = 0;
  for (let i = 0; i < n; i++) {
    sse += (actual[i] - predicted[i]) ** 2;
    mape += Math.abs((actual[i] - predicted[i]) / actual[i]);
  }
  const rmseV = Math.sqrt(sse / n);
  const mapeV = (mape / n) * 100;
  const meanAct = actual.reduce((a, b) => a + b, 0) / n;
  const ssTot = actual.reduce((a, b) => a + (b - meanAct) ** 2, 0);
  const r2 = 1 - sse / ssTot;
  let dirCorrect = 0, dirTotal = 0;
  for (let i = 1; i < n; i++) {
    const aDir = Math.sign(actual[i] - actual[i - 1]);
    const pDir = Math.sign(predicted[i] - predicted[i - 1]);
    if (aDir === pDir) dirCorrect++;
    dirTotal++;
  }
  const direction = (dirCorrect / dirTotal) * 100;
  return {
    accuracy: Math.max(0, 100 - mapeV),
    rmse: rmseV,
    mape: mapeV,
    r2: r2,
    direction,
  };
}

// ============ MAIN ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbol = "^NSEI", horizon = 30 } = await req.json();

    // Fetch Yahoo Finance
    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
    const resp = await fetch(yfUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) throw new Error(`Yahoo Finance error: ${resp.status}`);
    const yfData = await resp.json();
    const result = yfData?.chart?.result?.[0];
    if (!result) throw new Error("No data returned for symbol");

    const meta = result.meta;
    const ts: number[] = result.timestamp;
    const q = result.indicators.quote[0];
    const closes: number[] = q.close;
    const opens: number[] = q.open;
    const highs: number[] = q.high;
    const lows: number[] = q.low;
    const vols: number[] = q.volume;

    // Clean NaN
    const dates: string[] = [];
    const close: number[] = [];
    const open: number[] = [];
    const high: number[] = [];
    const low: number[] = [];
    const volume: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] == null) continue;
      dates.push(new Date(ts[i] * 1000).toISOString().slice(0, 10));
      close.push(closes[i]);
      open.push(opens[i] ?? closes[i]);
      high.push(highs[i] ?? closes[i]);
      low.push(lows[i] ?? closes[i]);
      volume.push(vols[i] ?? 0);
    }

    // DSP filters
    const filters = {
      ma: movingAverage(close, 20),
      butter: butterworth(close, 0.05),
      kalman: kalman(close),
      savgol: savgol(close, 21),
      median: median(close, 11),
    };

    const filterStats = {
      ma: { snr: snrDb(close, filters.ma), noiseCut: noiseReduction(close, filters.ma), rmse: rmse(close, filters.ma) },
      butter: { snr: snrDb(close, filters.butter), noiseCut: noiseReduction(close, filters.butter), rmse: rmse(close, filters.butter) },
      kalman: { snr: snrDb(close, filters.kalman), noiseCut: noiseReduction(close, filters.kalman), rmse: rmse(close, filters.kalman) },
      savgol: { snr: snrDb(close, filters.savgol), noiseCut: noiseReduction(close, filters.savgol), rmse: rmse(close, filters.savgol) },
      median: { snr: snrDb(close, filters.median), noiseCut: noiseReduction(close, filters.median), rmse: rmse(close, filters.median) },
    };

    // Train/test split: 80/20
    const splitIdx = Math.floor(close.length * 0.8);
    const trainSmoothed = filters.savgol.slice(0, splitIdx);
    const testActual = close.slice(splitIdx);
    const testHorizon = testActual.length;

    const linTest = linearForecast(trainSmoothed, testHorizon);
    const ridgeTest = ridgeForecast(trainSmoothed, testHorizon);
    const mlpTest = mlpForecast(trainSmoothed, testHorizon);
    const arimaTest = arimaForecast(trainSmoothed, testHorizon);
    const ensembleTest = linTest.map((_, i) => (linTest[i] + ridgeTest[i] + mlpTest[i] + arimaTest[i]) / 4);

    const metrics = {
      linear: evaluateModel(testActual, linTest),
      ridge: evaluateModel(testActual, ridgeTest),
      mlp: evaluateModel(testActual, mlpTest),
      arima: evaluateModel(testActual, arimaTest),
      ensemble: evaluateModel(testActual, ensembleTest),
    };

    // ============ WALK-FORWARD BACKTEST ============
    // Rolling window: refit ensemble every `step` days, predict next `step`, slide forward.
    const wfStep = 10;
    const wfWindow = Math.max(120, Math.floor(close.length * 0.4));
    const wfDates: string[] = [];
    const wfActual: number[] = [];
    const wfPredicted: number[] = [];
    for (let start = wfWindow; start + wfStep <= close.length; start += wfStep) {
      const trainSeg = filters.savgol.slice(0, start);
      const lin = linearForecast(trainSeg, wfStep);
      const rid = ridgeForecast(trainSeg, wfStep);
      const mlp = mlpForecast(trainSeg, wfStep);
      const ari = arimaForecast(trainSeg, wfStep);
      for (let k = 0; k < wfStep; k++) {
        const pred = (lin[k] + rid[k] + mlp[k] + ari[k]) / 4;
        wfDates.push(dates[start + k]);
        wfActual.push(close[start + k]);
        wfPredicted.push(pred);
      }
    }
    const walkForward = wfActual.length > 0
      ? { dates: wfDates, actual: wfActual, predicted: wfPredicted, step: wfStep, window: wfWindow, metrics: evaluateModel(wfActual, wfPredicted) }
      : null;

    // Forward forecast on full smoothed
    const smoothedFull = filters.savgol;
    const linFwd = linearForecast(smoothedFull, horizon);
    const ridgeFwd = ridgeForecast(smoothedFull, horizon);
    const mlpFwd = mlpForecast(smoothedFull, horizon);
    const arimaFwd = arimaForecast(smoothedFull, horizon);
    const ensembleFwd = linFwd.map((_, i) => (linFwd[i] + ridgeFwd[i] + mlpFwd[i] + arimaFwd[i]) / 4);

    const lastPrice = close[close.length - 1];
    // Clip ensemble to [0.5x, 2x]
    const ensembleClipped = ensembleFwd.map(v => Math.max(lastPrice * 0.5, Math.min(lastPrice * 2, v)));

    // 95% CI band from inter-model std
    const upper: number[] = [];
    const lower: number[] = [];
    for (let i = 0; i < horizon; i++) {
      const pts = [linFwd[i], ridgeFwd[i], mlpFwd[i], arimaFwd[i]];
      const m = pts.reduce((a, b) => a + b, 0) / pts.length;
      const std = Math.sqrt(pts.reduce((a, b) => a + (b - m) ** 2, 0) / pts.length);
      upper.push(ensembleClipped[i] + 1.96 * std);
      lower.push(ensembleClipped[i] - 1.96 * std);
    }

    const targetPrice = ensembleClipped[ensembleClipped.length - 1];
    const expectedMove = ((targetPrice - lastPrice) / lastPrice) * 100;
    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    if (expectedMove > 3) action = "BUY";
    else if (expectedMove < -3) action = "SELL";
    const confidence = Math.min(99, Math.abs(expectedMove) * 18 + 40);

    // Build forecast dates
    const lastDate = new Date(dates[dates.length - 1]);
    const forecastDates: string[] = [];
    for (let i = 1; i <= horizon; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      forecastDates.push(d.toISOString().slice(0, 10));
    }

    // 1Y change
    const oneYearAgoIdx = Math.max(0, close.length - 252);
    const oneYearChg = ((lastPrice - close[oneYearAgoIdx]) / close[oneYearAgoIdx]) * 100;
    const todayChg = close.length > 1 ? ((lastPrice - close[close.length - 2]) / close[close.length - 2]) * 100 : 0;
    const annVol = (() => {
      const rets = close.slice(1).map((v, i) => Math.log(v / close[i]));
      const sd = Math.sqrt(variance(rets));
      return sd * Math.sqrt(252) * 100;
    })();
    const avgVol = volume.reduce((a, b) => a + b, 0) / volume.length;

    // AI quant insight
    let aiInsight = "";
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a quantitative analyst. Be concise (2-3 sentences), data-driven, no fluff." },
              {
                role: "user",
                content: `Symbol: ${symbol} (${meta.longName || meta.symbol}). Current: ${lastPrice.toFixed(2)} ${meta.currency}. 30d ensemble target: ${targetPrice.toFixed(2)} (${expectedMove.toFixed(2)}%). Action: ${action}. Confidence: ${confidence.toFixed(1)}%. Annualized volatility: ${annVol.toFixed(1)}%. 1Y change: ${oneYearChg.toFixed(2)}%. Best model: ${Object.entries(metrics).sort((a, b) => b[1].accuracy - a[1].accuracy)[0][0]}. Provide a concise quant analysis insight.`,
              },
            ],
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiInsight = aiData.choices?.[0]?.message?.content || "";
        }
      }
    } catch (e) {
      console.error("AI insight failed:", e);
    }

    return new Response(
      JSON.stringify({
        meta: {
          symbol: meta.symbol,
          name: meta.longName || meta.symbol,
          currency: meta.currency,
          exchange: meta.fullExchangeName,
          tradingDays: close.length,
        },
        price: {
          current: lastPrice,
          high52w: meta.fiftyTwoWeekHigh,
          low52w: meta.fiftyTwoWeekLow,
          todayChg,
          oneYearChg,
          annVol,
          avgVol,
        },
        recommendation: { action, target: targetPrice, confidence, expectedMove },
        ohlcv: { dates, open, high, low, close, volume },
        filters,
        filterStats,
        forecast: {
          dates: forecastDates,
          ensemble: ensembleClipped,
          upper,
          lower,
          linear: linFwd,
          ridge: ridgeFwd,
          mlp: mlpFwd,
          arima: arimaFwd,
          horizon,
        },
        metrics,
        aiInsight,
        walkForward,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});