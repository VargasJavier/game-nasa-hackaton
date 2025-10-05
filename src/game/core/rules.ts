import type { Forecast, Plot, Stage } from "./types";
import { EVAP_PER_TURN, MOISTURE_OK, RAIN_TO_MOISTURE } from "./constants";

const clampStage = (n: number): Stage =>
  (n < 0 ? 0 : n > 5 ? 5 : Math.floor(n)) as Stage;

export const incStage = (s: Stage): Stage => clampStage(s + 1);
export const decStage = (s: Stage): Stage => clampStage(s - 1);

export function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }

export function rollForecast(): Forecast {
  const r = Math.random();
  if (r > .7) return { mm: 8 + Math.random()*8, label: "fuerte" };
  if (r > .4) return { mm: 3 + Math.random()*3, label: "moderada" };
  if (r > .2) return { mm: 0.5 + Math.random()*1.5, label: "ligera" };
  return { mm: 0, label: "seca" };
}

export function stepGrowth(p: Plot, fc: Forecast): Plot {
  if (!p.alive) return p;

  const rainMoisture = fc.mm * RAIN_TO_MOISTURE;
  const moisture = clamp01(p.moisture + rainMoisture - EVAP_PER_TURN);

  let stage = p.stage;

  if (stage > 0 && stage < 5){
    if (moisture >= MOISTURE_OK.min && moisture <= MOISTURE_OK.max) stage = incStage(stage);
    else if (moisture < 0.15 && stage > 1) stage = decStage(stage);
  }

  const alive = !(moisture <= 0.05 && stage > 0);
  return { ...p, stage, moisture, alive, isIrrigated: false };
}

export function ndviProxy(plots: Plot[]): number {
  const planted = plots.filter(p => p.stage > 0 && p.alive);
  if (!planted.length) return 0;
  const s = planted.reduce((acc,p)=> acc + (p.stage/5) * (0.5 + 0.5*p.moisture), 0);
  return clamp01(s / planted.length);
}
