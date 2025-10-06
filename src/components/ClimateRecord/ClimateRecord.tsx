// types.ts
export type ClimateRecord = {
  Id: number;
  IdDepartamento: string;
  Departamento: string;
  MesId: number;     // 1..12
  Año: number;
  Mes: string;       // "Enero", "Febrero", etc. opcional
  humedad: number;
  precipitacion: number;
  temperatura: number;
};

export type MonthlyAverages = {
  mesId: number;
  mesNombre: string;
  avg: {
    temperatura: number;
    humedad: number;
    precipitacion: number;
  };
  n: number;
};

export type ForecastPoint = {
  año: number;
  mesId: number;
  mesNombre: string;
  temperatura: number;
  humedad: number;
  precipitacion: number;
};

const MESes = [
  "", "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function sortChrono(a: ClimateRecord, b: ClimateRecord) {
  if (a.Año !== b.Año) return a.Año - b.Año;
  return a.MesId - b.MesId;
}

function safeMean(nums: number[]): number {
  if (!nums.length) return NaN;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

export function computeMonthlyAverages(records: ClimateRecord[]): MonthlyAverages[] {
  const byMonth = new Map<number, ClimateRecord[]>();
  for (const r of records) {
    if (!byMonth.has(r.MesId)) byMonth.set(r.MesId, []);
    byMonth.get(r.MesId)!.push(r);
  }
  const out: MonthlyAverages[] = [];
  for (let m = 1; m <= 12; m++) {
    const arr = byMonth.get(m) ?? [];
    out.push({
      mesId: m,
      mesNombre: MESes[m],
      avg: {
        temperatura: safeMean(arr.map(r => r.temperatura)),
        humedad: safeMean(arr.map(r => r.humedad)),
        precipitacion: safeMean(arr.map(r => r.precipitacion)),
      },
      n: arr.length
    });
  }
  return out;
}

// Regresión lineal simple y = a + b*t
function linearTrend(y: number[]) {
  const n = y.length;
  const xs = Array.from({ length: n }, (_, i) => i); // t = 0..n-1
  const meanX = (n - 1) / 2;
  const meanY = safeMean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    num += dx * (y[i] - meanY);
    den += dx * dx;
  }
  const b = den === 0 ? 0 : num / den;
  const a = meanY - b * meanX;
  return { a, b };
}

// Construye modelo: tendencia global + estacionalidad por mes (media de residuos)
function seasonalTrendModel(values: number[], months: number[]) {
  // values y months deben estar ordenados cronológicamente
  const { a, b } = linearTrend(values);
  const residualsByMonth = new Map<number, number[]>();
  for (let i = 0; i < values.length; i++) {
    const yhat = a + b * i;
    const res = values[i] - yhat;
    const m = months[i];
    if (!residualsByMonth.has(m)) residualsByMonth.set(m, []);
    residualsByMonth.get(m)!.push(res);
  }
  const seasonal = Array.from({ length: 13 }, () => 0); // 0..12
  for (let m = 1; m <= 12; m++) {
    const rs = residualsByMonth.get(m) ?? [];
    seasonal[m] = rs.length ? safeMean(rs) : 0;
  }
  return {
    a, b, seasonal,
    // Predicción para índice t (0..), con mes m
    predictAt: (tIndex: number, mesId: number) => a + b * tIndex + (seasonal[mesId] ?? 0)
  };
}

export function buildClimateForecast(records: ClimateRecord[], targetYear: number): ForecastPoint[] {
  const data = [...records].sort(sortChrono);
  if (!data.length) return [];

  // series ordenadas
  const temps = data.map(r => r.temperatura);
  const hums  = data.map(r => r.humedad);
  const precs = data.map(r => r.precipitacion);
  const months = data.map(r => r.MesId);

  const modelT = seasonalTrendModel(temps, months);
  const modelH = seasonalTrendModel(hums, months);
  const modelP = seasonalTrendModel(precs, months);

  // tIndex del último punto + 1 es el próximo mes
  const startIndex = data.length; // 60 si son 5 años completos
  const firstHistYear = data[0].Año;
  const lastHistYear  = data[data.length - 1].Año;

  // Genera pronóstico para los 12 meses del targetYear
  const forecast: ForecastPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    // ¿qué índice t le corresponde a (targetYear, m)?
    const monthsSinceStart =
      (targetYear - firstHistYear) * 12 + (m - data[0].MesId); // aproximación
    // Mejor: calcular relativo al final
    const t = (targetYear - lastHistYear) * 12 + m + (data[data.length - 1].MesId - 12);

    const idx = startIndex + (m - 1) + (targetYear - lastHistYear - 1) * 12 + (12 - (data[data.length - 1].MesId));

    // El cálculo anterior puede marear; usa uno estable:
    const tIndex = data.findIndex(
      _ => false
    ) === -1
      ? startIndex + (m - 1) + (targetYear - lastHistYear) * 12
      : startIndex + (m - 1); // fallback

    const yT = modelT.predictAt(tIndex, m);
    const yH = modelH.predictAt(tIndex, m);
    const yP = modelP.predictAt(tIndex, m);

    forecast.push({
      año: targetYear,
      mesId: m,
      mesNombre: MESes[m],
      temperatura: round1(yT),
      humedad: round1(yH),
      precipitacion: round2(yP)
    });
  }
  return forecast;
}

function round1(x: number) { return Math.round(x * 10) / 10; }
function round2(x: number) { return Math.round(x * 100) / 100; }

// Helper opcional: filtra por departamento antes de calcular
export function filterByDepartamento(records: ClimateRecord[], idDepto: string) {
  return records.filter(r => r.IdDepartamento === idDepto);
}
