import { create } from "zustand";
import type {
  Forecast, Inventory, Plot, Player, SeedRef, Stage
} from "../../game/core/types";
import { INTERACT_RADIUS, PLAYER, SCENE } from "../../game/core/constants";
import { rollForecast, stepGrowth, ndviProxy } from "../../game/core/rules";

/* ---------- helpers ---------- */
const clampScene = (x:number,y:number) => ({
  x: Math.max(0, Math.min(SCENE.w - PLAYER.w, x)),
  y: Math.max(0, Math.min(SCENE.h - PLAYER.h, y)),
});
const dist = (ax:number,ay:number,bx:number,by:number) => Math.hypot(ax-bx, ay-by);
const incStage = (s: Stage): Stage => Math.min(5, (s + 1) as Stage) as Stage;

function nearestPlotId(player: Player, plots: Plot[]) {
  const cx = player.x + player.w/2, cy = player.y + player.h/2;
  let best: string | null = null, dBest = Infinity;
  for (const p of plots){
    const d = dist(cx, cy, p.x+36, p.y+36);
    if (d < dBest && d <= INTERACT_RADIUS){ best = p.id; dBest = d; }
  }
  return best;
}

function makePlots(n: number): Plot[] {
  const out: Plot[] = [];
  const origin = { x: 350, y: 250 };
  const cols = 3;
  let idx = 0;
  for (let r=0;r<Math.ceil(n/cols);r++){
    for (let c=0;c<cols && idx<n;c++){
      out.push({
        id:`p${idx}`,
        x: origin.x + c*86,
        y: origin.y + r*86,
        stage: 0 as const,
        moisture: 0.25,
        alive: true,
        isIrrigated: false,
        seed: null
      });
      idx++;
    }
  }
  return out;
}

/* ---------- store ---------- */
type Facing = "left" | "right";

type GameState = {
  // core
  player: Player & { facing: Facing };
  plots: Plot[];
  forecast: Forecast;
  ndvi: number;

  // recursos / meta
  resources: { waterTanks: number[]; currency: number; turn: number };
  numPlots: number;
  decorations: string[];

  // inventario
  inventory: Inventory;
  selectedSeedId: string | null;

  // UI
  showShop: boolean;
  showControls: boolean;

  // selectors
  nearestId(): string | null;

  // actions
  move(dx:number,dy:number,dt:number): void;
  face(dir: Facing): void;

  selectSeed(id: string): void;
  cycleSeed(): void;

  plant(): void;                   // si stage 0: siembra; 1-4: crecimiento forzado; 5: cosecha
  harvest(id: string): void;
  irrigate(): void;                // gasta 1 del primer tanque con agua, +humedad y marca irrigado
  nextTurn(): void;                // aplica lluvia y evap, limpia isIrrigated

  setNumPlots(n:number): void;     // rehace el grid
  addTank(): void;

  // utilidades para Shop (si la usas)
  setInventory(inv: Inventory): void;
  setCurrency(v: number): void;
  setDecorations(ids: string[]): void;
  toggleShop(): void;
  toggleControls(): void;
};

export const useGame = create<GameState>((set, get) => ({
  player: { x: 360, y: 430, w: PLAYER.w, h: PLAYER.h, facing: "right" },
  plots: makePlots(1),
  forecast: rollForecast(),
  ndvi: 0,

  resources: { waterTanks: [0], currency: 100000, turn: 1 },
  numPlots: 1,
  decorations: [],

  inventory: [
    { id:"seed1", name:"Corn Seed", type:"seed", quantity:5, price:10, icon:{ type:"emoji", href:"🌽" } },
    { id:"crop",  name:"Corn",      type:"crop", quantity:1, price: 5, icon:{ type:"emoji", href:"🌽" } },
  ],
  selectedSeedId: "seed1",

  showShop: false,
  showControls: false,

  /* selectors */
  nearestId(){ return nearestPlotId(get().player, get().plots); },

  /* movimiento y facing (para cambiar sprite izquierda/derecha) */
  move(dx,dy,dt){
    if (!dx && !dy) return;
    const len = Math.hypot(dx,dy)||1; dx/=len; dy/=len;
    set(s => ({ player: {
      ...s.player,
      ...clampScene(s.player.x + dx*PLAYER.speed*dt, s.player.y + dy*PLAYER.speed*dt)
    }}));
  },
  face(dir){ set(s => ({ player: { ...s.player, facing: dir }})); },

  /* inventario */
  selectSeed(id){ set({ selectedSeedId: id }); },
  cycleSeed(){
    const seeds = get().inventory.filter(i => i.type==="seed" && i.quantity>0);
    if (!seeds.length) return;
    const cur = get().selectedSeedId;
    const idx = seeds.findIndex(s => s.id===cur);
    set({ selectedSeedId: seeds[(idx===-1?0:(idx+1)%seeds.length)].id });
  },

  /* siembra/crecimiento/cosecha como en tu versión larga */
  plant(){
    const id = get().nearestId();
    if (!id) return;

    const plots = get().plots;
    const target = plots.find(p => p.id===id)!;

    // si está maduro, cosecha directo (comportamiento original)
    if (target.stage === 5) {
      get().harvest(id);
      return;
    }

    // si está vacío, siembra usando semilla seleccionada e inventario
    if (target.stage === 0) {
      const selId = get().selectedSeedId;
      if (!selId) return;

      const inv = structuredClone(get().inventory) as Inventory;
      const seedItem = inv.find(i => i.id===selId && i.type==="seed");
      if (!seedItem || seedItem.quantity <= 0) return;

      seedItem.quantity -= 1;
      const cleaned = inv.filter(i => !(i.type==="seed" && i.quantity<=0));

      set(s => ({
        inventory: cleaned,
        plots: s.plots.map(p => p.id===id
          ? {
              ...p,
              stage: 1 as const,
              moisture: Math.max(p.moisture, 0.25),
              seed: { id: seedItem.id, name: seedItem.name, icon: seedItem.icon as SeedRef["icon"] }
            }
          : p
        )
      }));
      return;
    }

    // si está entre 1 y 4, “crecimiento forzado” + pequeña subida de humedad (tu atajo)
    set(s => ({
      plots: s.plots.map(p =>
        p.id===id && p.stage>0 && p.stage<5
          ? { ...p, stage: incStage(p.stage), moisture: Math.min(1, p.moisture + 0.1) }
          : p
      )
    }));
  },

  harvest(id){
    const p = get().plots.find(pl => pl.id===id);
    if (!p || p.stage!==5 || !p.seed) return;

    const inv = structuredClone(get().inventory) as Inventory;

    // Normalize seed name to a produce name (remove trailing "Seed")
    const seedName = p.seed.name || "";
    const produceName = seedName.replace(/\s*[Ss]eed$/,'').trim() || seedName;

    // Try to find an existing crop by produce name first, then by seed id
    let crop = inv.find(i => i.type === "crop" && i.name === produceName) as (typeof inv)[number] | undefined;
    if (!crop) crop = inv.find(i => i.type === "crop" && i.id === p.seed!.id);

    if (crop) {
      crop.quantity += 1;
    } else {
      // create a slug id from the produce name, fallback to seed id
      const idSlug = produceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || p.seed.id;
      inv.push({ id: idSlug, name: produceName, type:"crop", quantity:1, price:5, icon: p.seed.icon });
    }

    set(s => ({
      inventory: inv,
      plots: s.plots.map(pl => pl.id === id
        ? { ...pl, stage: 0 as const, seed: null }
        : pl)
    }));
  },

  irrigate(){
    const id = get().nearestId();
    if (!id) return;
    const target = get().plots.find(p => p.id===id)!;
    // igual que tu condición: no riegues etapas muy tempranas
    if (target.stage < 2) return;

    const total = get().resources.waterTanks.reduce((a,b)=>a+b,0);
    if (total<=0) return;

    set(s => {
      const waterTanks = [...s.resources.waterTanks];
      for (let i=0;i<waterTanks.length;i++){
        if (waterTanks[i] > 0){ waterTanks[i] = Math.max(0, waterTanks[i]-1); break; }
      }
      return {
        resources: { ...s.resources, waterTanks },
        plots: s.plots.map(p => p.id===id
          ? { ...p, moisture: Math.min(1, p.moisture + 0.25), isIrrigated: true }
          : p
        )
      };
    });
  },

  nextTurn(){
    set(s => {
      const newPlots = s.plots.map(p => stepGrowth(p, s.forecast)); // stepGrowth ya limpia isIrrigated
      const ndvi = ndviProxy(newPlots);
      const rainRecharge = s.forecast.mm >= 5 ? 2 : 0;

      const waterTanks = [...s.resources.waterTanks];
      if (rainRecharge>0){
        if (waterTanks.length===0) waterTanks.push(0);
        waterTanks[0] = Math.min(10, waterTanks[0] + rainRecharge);
      }

      return {
        plots: newPlots,
        ndvi,
        resources: { ...s.resources, waterTanks, turn: s.resources.turn + 1 },
        forecast: rollForecast()
      };
    });
  },

  setNumPlots(n){
    set(() => ({ numPlots: n, plots: makePlots(n) }));
  },

  addTank(){ set(s => ({ resources: { ...s.resources, waterTanks: [...s.resources.waterTanks, 0] }})); },

  // utilidades para Shop
  setInventory(inv){ set({ inventory: inv }); },
  setCurrency(v){ set(s => ({ resources: { ...s.resources, currency: v } })); },
  setDecorations(ids){ set({ decorations: ids }); },

  toggleShop(){ set(s => ({ showShop: !s.showShop })); },
  toggleControls(){ set(s => ({ showControls: !s.showControls })); },
}));
