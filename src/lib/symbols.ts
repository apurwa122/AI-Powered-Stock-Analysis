export const SYMBOLS = [
  { value: "^NSEI", label: "NIFTY 50 Index" },
  { value: "^BSESN", label: "BSE SENSEX" },
  { value: "^NSEBANK", label: "NIFTY Bank" },
  { value: "RELIANCE.NS", label: "Reliance Industries" },
  { value: "TCS.NS", label: "Tata Consultancy" },
  { value: "INFY.NS", label: "Infosys" },
  { value: "HDFCBANK.NS", label: "HDFC Bank" },
  { value: "ICICIBANK.NS", label: "ICICI Bank" },
  { value: "SBIN.NS", label: "State Bank of India" },
  { value: "ITC.NS", label: "ITC Ltd" },
  { value: "AAPL", label: "Apple Inc." },
  { value: "MSFT", label: "Microsoft" },
  { value: "GOOGL", label: "Alphabet" },
  { value: "TSLA", label: "Tesla" },
  { value: "NVDA", label: "NVIDIA" },
  { value: "BTC-USD", label: "Bitcoin USD" },
];

export const PRESETS: { id: string; label: string; symbols: string[]; desc: string }[] = [
  { id: "nifty-leaders", label: "NIFTY Leaders", desc: "Top India large-caps", symbols: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"] },
  { id: "indian-banks", label: "Indian Banks", desc: "Banking sector basket", symbols: ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "^NSEBANK"] },
  { id: "us-mega-tech", label: "US Mega-Cap Tech", desc: "FAANG-style basket", symbols: ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"] },
  { id: "indices", label: "Global Indices", desc: "Benchmark indices", symbols: ["^NSEI", "^BSESN", "^NSEBANK"] },
  { id: "crypto", label: "Crypto", desc: "Digital assets", symbols: ["BTC-USD"] },
];

export const HORIZONS = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
];

export type AnalyzeResult = {
  meta: { symbol: string; name: string; currency: string; exchange: string; tradingDays: number };
  price: { current: number; high52w: number; low52w: number; todayChg: number; oneYearChg: number; annVol: number; avgVol: number };
  recommendation: { action: "BUY" | "SELL" | "HOLD"; target: number; confidence: number; expectedMove: number };
  ohlcv: { dates: string[]; open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] };
  filters: { ma: number[]; butter: number[]; kalman: number[]; savgol: number[]; median: number[] };
  filterStats: Record<string, { snr: number; noiseCut: number; rmse: number }>;
  forecast: { dates: string[]; ensemble: number[]; upper: number[]; lower: number[]; linear: number[]; ridge: number[]; mlp: number[]; arima: number[]; horizon: number };
  metrics: Record<string, { accuracy: number; rmse: number; mape: number; r2: number; direction: number }>;
  aiInsight: string;
  walkForward: null | {
    dates: string[]; actual: number[]; predicted: number[]; step: number; window: number;
    metrics: { accuracy: number; rmse: number; mape: number; r2: number; direction: number };
  };
};

export function currencySymbol(cur: string): string {
  const map: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
  return map[cur] || "";
}

export function fmtNum(n: number, d = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtCompact(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}