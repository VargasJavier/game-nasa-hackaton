// climate-forecast.ts
type ClimateRecord = {
  Id: number;
  IdDepartamento: string;
  Departamento: string;
  MesId: number;     // 1..12
  Año: number;
  Mes: string;
  humedad: number;
  precipitacion: number;
  temperatura: number;
};

const MESES = [
  "", "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function sortChrono(a: ClimateRecord, b: ClimateRecord) {
  if (a.Año !== b.Año) return a.Año - b.Año;
  return a.MesId - b.MesId;
}

function mean(xs: number[]) { return xs.length ? xs.reduce((s,x)=>s+x,0)/xs.length : NaN; }
function median(xs: number[]) {
  if (!xs.length) return NaN;
  const a = [...xs].sort((x,y)=>x-y);
  const m = Math.floor(a.length/2);
  return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
}

function linearTrend(y: number[]) {
  const n = y.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = (n - 1) / 2;
  const my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    num += dx * (y[i] - my);
    den += dx * dx;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  return { a, b };
}

// Modelo: tendencia global + estacionalidad mensual (media de residuos)
function seasonalTrendModel(values: number[], months: number[]) {
  const { a, b } = linearTrend(values);
  const residualsByMonth = Array.from({ length: 13 }, () => [] as number[]);
  for (let i = 0; i < values.length; i++) {
    const yhat = a + b * i;
    residualsByMonth[months[i]].push(values[i] - yhat);
  }
  const seasonal = residualsByMonth.map(rs => rs.length ? mean(rs) : 0);
  return {
    predictAt: (tIndex: number, mesId: number) => a + b * tIndex + (seasonal[mesId] ?? 0),
  };
}

function monthlyStat(
  records: ClimateRecord[],
  mesId: number,
  field: keyof Pick<ClimateRecord,"temperatura"|"humedad"|"precipitacion">,
  stat: "mean" | "median" = "mean"
) {
  const vals = records.filter(r => r.MesId === mesId).map(r => r[field] as number);
  const v = stat === "median" ? median(vals) : mean(vals);
  return Number.isFinite(v) ? v : NaN;
}

export function forecastYearForDept(
  records: ClimateRecord[],
  idDepto: string,
  year: number = new Date().getFullYear(),
  method: "trend+seasonal" | "seasonal-mean" = "trend+seasonal"
): ClimateRecord[] {
  const depto = records.filter(r => r.IdDepartamento === idDepto).sort(sortChrono);
  if (!depto.length) return [];

  const firstYear = depto[0].Año;
  const last = depto[depto.length - 1];

  // series cronológicas
  const temps = depto.map(r => r.temperatura);
  const hums  = depto.map(r => r.humedad);
  const precs = depto.map(r => r.precipitacion);
  const months = depto.map(r => r.MesId);

  const modelT = method === "trend+seasonal" ? seasonalTrendModel(temps, months) : null;
  const modelH = method === "trend+seasonal" ? seasonalTrendModel(hums,  months) : null;
  const modelP = method === "trend+seasonal" ? seasonalTrendModel(precs, months) : null;

  // índice t del primer dato histórico es 0; del último es depto.length - 1
  // Para el año solicitado, calculamos tIndex relativo al inicio
  const tIndexBase = depto.length; // enero del siguiente mes a lo último observado

  // Usamos el nombre del departamento del último registro
  const nombreDepto = last.Departamento;
  const idDepartamento = last.IdDepartamento;

  const out: ClimateRecord[] = [];
  for (let m = 1; m <= 12; m++) {
    const tIndex = tIndexBase + (year - last.Año - (last.MesId === 12 ? 0 : 1)) * 12 + (m - 1) + (12 - last.MesId);

    const temperatura =
      method === "trend+seasonal"
        ? modelT!.predictAt(tIndex, m)
        : monthlyStat(depto, m, "temperatura", "mean");

    const humedad =
      method === "trend+seasonal"
        ? modelH!.predictAt(tIndex, m)
        : monthlyStat(depto, m, "humedad", "mean");

    const precipitacion =
      method === "trend+seasonal"
        ? modelP!.predictAt(tIndex, m)
        : monthlyStat(depto, m, "precipitacion", "mean");

    out.push({
      // No hay Id real para futuro. Si te sirve para keys en React, usa `${idDepto}-${year}-${m}`
      Id: 0,
      IdDepartamento: idDepartamento,
      Departamento: nombreDepto,
      MesId: m,
      Año: year,
      Mes: MESES[m],
      humedad: Math.round(humedad * 100) / 100,
      precipitacion: Math.round(precipitacion * 100) / 100,
      temperatura: Math.round(temperatura * 10) / 10
    });
  }
  return out;
}
