import type { Player, Plot } from '../core/types';
import { INTERACT_RADIUS, SCENE, PLAYER } from '../core/constants';

export function nearestPlot(player: Player, plots: Plot[]): Plot | null {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  let best: Plot | null = null;
  let bestDistance = Infinity;

  for (const plot of plots) {
    const d = Math.hypot(cx - (plot.x + 36), cy - (plot.y + 36));
    if (d < bestDistance && d <= INTERACT_RADIUS) {
      best = plot;
      bestDistance = d;
    }
  }

  return best;
}

export function clampToScene(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(SCENE.w - PLAYER.w, x)),
    y: Math.max(0, Math.min(SCENE.h - PLAYER.h, y)),
  };
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function makePlots(numPlots: number): Plot[] {
  const out: Plot[] = [];
  const origin = { x: 350, y: 250 };
  const cols = 3; // max columns
  let idx = 0;
  for (let r = 0; r < Math.ceil(numPlots / cols); r++) {
    for (let c = 0; c < cols && idx < numPlots; c++) {
      out.push({
        id: `p${idx}`,
        x: origin.x + c * 86,
        y: origin.y + r * 86,
        stage: 0,
        moisture: 0.25,
        alive: true,
        isIrrigated: false,
        seed: null,
      });
      idx++;
    }
  }
  return out;
}

export function stepGrowth(p: Plot, fc: { mm: number; label: string }): Plot {
  if (!p.alive) return p;
  // lluvia aumenta humedad
  const rainMoisture = fc.mm / 20; // 5mm ⇒ +0.25 aprox
  let moisture = Math.max(0, Math.min(1, p.moisture + rainMoisture - 0.15)); // evapo por turno
  let stage = p.stage;

  // si está plantado, crece si humedad en rango útil
  if (stage > 0 && stage < 5) {
    if (moisture >= 0.3 && moisture <= 0.85) stage++;
    else if (moisture < 0.15) { // estrés fuerte
      if (stage > 1) stage--;   // retrocede
    }
  }
  // muerte por sequía prolongada
  let alive: boolean = p.alive;
  if (moisture <= 0.05 && stage > 0) alive = false;

  return { ...p, stage: stage as Plot['stage'], moisture, alive, isIrrigated: false };
}

export function rollForecast() {
  const r = Math.random();
  if (r > .7) return { mm: 8 + Math.random() * 8, label: "fuerte" as const };
  if (r > .4) return { mm: 3 + Math.random() * 3, label: "moderada" as const };
  if (r > .2) return { mm: 0.5 + Math.random() * 1.5, label: "ligera" as const };
  return { mm: 0, label: "seca" as const };
}