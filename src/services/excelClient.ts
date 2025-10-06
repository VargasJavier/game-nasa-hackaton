// excelClient.ts
import * as XLSX from "xlsx";

export type ClimateRecord = {
  Id: number;
  IdDepartamento: string;
  Departamento: string;
  MesId: number;   // 1..12
  Año: number;
  Mes: string;
  humedad: number;
  precipitacion: number;
  temperatura: number;
};

const FILE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.BASE_URL)
    ? `${(import.meta as any).env.BASE_URL}DATA.xlsx`
    : "/DATA.xlsx";

let cache: ClimateRecord[] | null = null;

export async function getAllData(): Promise<ClimateRecord[]> {
  if (cache) return cache;

  const res = await fetch(FILE_URL);
  if (!res.ok) throw new Error(`No pude cargar DATA.xlsx: ${res.status}`);
  const ab = await res.arrayBuffer();

  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null, raw: true });

  // Normaliza headers y tipos. Manejo de "Año"/"Ano"/"Anio" por si las moscas.
  const data: ClimateRecord[] = rows.map((r: any) => ({
    Id: Number(r.Id),
    IdDepartamento: String(r.IdDepartamento ?? ""),
    Departamento: String(r.Departamento ?? ""),
    MesId: Number(r.MesId),
    Año: Number(r["Año"] ?? r["Ano"] ?? r["Anio"]),
    Mes: String(r.Mes ?? ""),
    humedad: Number(r.humedad),
    precipitacion: Number(r.precipitacion),
    temperatura: Number(r.temperatura),
  }))
  // filtra filas basura
  .filter(
    d =>
      Number.isFinite(d.Id) &&
      d.IdDepartamento &&
      Number.isFinite(d.MesId) &&
      Number.isFinite(d.Año)
  );

  cache = data;
  return data;
}

export async function getDataByIdDepartamento(idDepartamento: string) {
  const data = await getAllData();
  console.log('DATA', data)
  const id = String(idDepartamento).toLowerCase();
  const filtered = data.filter(
    item => String(item.IdDepartamento).toLowerCase() === id
  );
  // útil para debug rápido en front
  // console.log("Filtered results count:", filtered.length);
  return filtered;
}
