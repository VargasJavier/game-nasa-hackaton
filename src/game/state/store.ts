import { create } from "zustand";
import type {
  Forecast, Inventory, Plot, Player, SeedRef, Stage
} from "../../game/core/types";
import { INTERACT_RADIUS, PLAYER, SCENE, RIVER_POSITION, MAX_TANK_CAPACITY } from "../../game/core/constants";
import { rollForecast } from "../../game/core/rules";

// export type PlotStage = 0|1|2|3|4|5; // 0 suelo, 1 brote… 5 dorado/cosecha
export type PlotStage = 0|1; // 0 suelo, 1 brote… 5 dorado/cosecha
export type Tile = { id:number; x:number; y:number; stage:PlotStage; moisture:number; hasCrop:boolean; };

type Weather = { label:string; rainMm:number; prob:number; };
type Resources = { water:number; aquifer:number; turns:number; score:{prod:number;sost:number;res:number} };

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
  player: Player & { facing: Facing };
  plots: Plot[];
  forecast: Forecast;
  ndvi: number;
  grid: Tile[];
  res: Resources;
  weather: Weather;
  isNearRiver: boolean;
  drought: boolean;
  selectedAction: "plant" | "water" | "harvest" | null;

  // tutorial
  tutorialShown: boolean;
  riverTutorialCompleted: boolean;
  shopTutorialCompleted: boolean;
  seedTutorialCompleted: boolean;
  closeShopTutorialCompleted: boolean;
  plantTutorialCompleted: boolean;
  weatherTutorialCompleted: boolean;
  finalTutorialCompleted: boolean;
    selectedRegion: string;
    selectedDistrict: string;
    playerName: string;

  // plots
  setPlots: (next: Plot[] | ((prev: Plot[]) => Plot[])) => void;
  updatePlot: (id: string, patch: Partial<Plot> | ((p: Plot) => Plot)) => void;
  resetPlots: (n: number) => void;

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

  setTutorialShown: (shown: boolean) => void;
  setRiverTutorialCompleted: (completed: boolean) => void;
  setShopTutorialCompleted: (completed: boolean) => void;
  setSeedTutorialCompleted: (completed: boolean) => void;
  setCloseShopTutorialCompleted: (completed: boolean) => void;
  setPlantTutorialCompleted: (completed: boolean) => void;
  setWeatherTutorialCompleted: (completed: boolean) => void;
  setFinalTutorialCompleted: (completed: boolean) => void;
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

  nextTurn: () => void;
  setAction: (a:GameState["selectedAction"]) => void;
  actOnTile: (id: number) => void;
  
  // utilidades para Shop (si la usas)
  setInventory(inv: Inventory): void;
  setCurrency(v: number): void;
  setDecorations(ids: string[]): void;
  toggleShop(): void;
  toggleControls(): void;

  setIsNearRiver: (isNearRiver: boolean) => void;
  setWaterTanks: (next: number[] | ((prev: number[]) => number[])) => void;
  addWaterTank: (value: number) => void;
  clearWaterTanks: () => void;

    setSelectedRegion: (region: string) => void;
    setSelectedDistrict: (district: string) => void;
    setPlayerName: (name: string) => void;
  reset: () => void;
};

const makeGrid = (cols=3, rows=3, origin={x:520,y:390}, size=72, gap=14): Tile[] =>
  Array.from({length: cols*rows}, (_,i)=>{
    const cx = i%cols, cy = (i/cols|0);
    return { id:i, x:origin.x+cx*(size+gap), y:origin.y+cy*(size+gap), stage:0, moisture:0.35, hasCrop:false };
  });

const nextForecast = ():Weather => {
  const p = Math.random();
  if (p>0.75) return {label:"Lluvia fuerte", rainMm:10+Math.random()*10, prob:p};
  if (p>0.45) return {label:"Lluvia", rainMm:3+Math.random()*5, prob:p};
  if (p>0.25) return {label:"Llovizna", rainMm:0.5+Math.random()*1.5, prob:p};
  return {label:"Seco", rainMm:0, prob:p};
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const MOISTURE_IRRIGATION_DELTA = 0.25;

export const useGame = create<GameState>((set, get) => ({
  player: { x: 360, y: 430, w: PLAYER.w, h: PLAYER.h, facing: "right" },
  plots: makePlots(1),
  forecast: rollForecast(),
  ndvi: 0,
  grid: makeGrid(),
  res: { water:100, aquifer:60, turns:1, score:{prod:0,sost:0,res:0} },
  weather: nextForecast(),
  drought: false,
  selectedAction: null,
  resources: { waterTanks: [0], currency: 100000, turn: 1 },
  numPlots: 1,
  isNearRiver: false,
  decorations: [],
  inventory: [
    { id:"seed1", name:"Corn Seed", type:"seed", quantity:5, price:10, icon:{ type:"emoji", href:"🌽" } },
    { id:"crop",  name:"Corn",      type:"crop", quantity:1, price: 5, icon:{ type:"emoji", href:"🌽" } },
  ],
  selectedSeedId: "seed1",

  showShop: false,
  showControls: false,

  tutorialShown: false,
  riverTutorialCompleted: false,
  shopTutorialCompleted: false,
  seedTutorialCompleted: false,
  closeShopTutorialCompleted: false,
  plantTutorialCompleted: false,
  weatherTutorialCompleted: false,
  finalTutorialCompleted: false,
    selectedRegion: "",
    selectedDistrict: "",
    playerName: "",

  // reemplaza SOLO waterTanks, dejando currency/turn intactos
  setWaterTanks: next =>
    set(state => {
      const prev = state.resources.waterTanks;
      const value = typeof next === "function" ? (next as (p: number[]) => number[])(prev) : next;
      // micro-optimización: si no cambia la referencia, no rompas nada
      if (value === prev) return state;
      return { resources: { ...state.resources, waterTanks: value } };
    }),

  // utilidades comunes
  addWaterTank: value =>
    set(state => ({
      resources: { ...state.resources, waterTanks: [...state.resources.waterTanks, value] }
    })),

  clearWaterTanks: () =>
    set(state => ({ resources: { ...state.resources, waterTanks: [] } })),

  setIsNearRiver: isNearRiver => set({isNearRiver: isNearRiver}),

  setPlots: next =>
    set(state => {
      const prev = state.plots;
      const value = typeof next === "function" ? (next as (p: Plot[]) => Plot[])(prev) : next;
      if (value === prev) return state;               // sin cambios, no re-render
      return { plots: value };
    }),

  // 2) Actualizar UNA parcela por id, inmutable y sin recrear todo por deporte
  updatePlot: (id, patch) =>
    set(state => {
      const i = state.plots.findIndex(p => p.id === id);
      if (i < 0) return state;                        // id inexistente, no rompas nada
      const curr = state.plots[i];
      const next = typeof patch === "function" ? (patch as (p: Plot) => Plot)(curr) : { ...curr, ...patch };
      if (next === curr) return state;                // nada cambió
      const copy = state.plots.slice();
      copy[i] = next;
      return { plots: copy };
  }),

  // 3) Recrear el tablero rápido
  resetPlots: n => set({ plots: makePlots(n) }),

  /* selectors */
  nearestId() { return nearestPlotId(get().player, get().plots); },
  
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

  setAction: (a)=> set({selectedAction:a}),
  actOnTile: (id)=>{
    const { grid, selectedAction, res } = get();
    const t = grid.find(g=>g.id===id)!;
    if (!t) return;

    if (selectedAction==="plant" && !t.hasCrop && res.water>=0) {
      t.hasCrop = true; t.stage = 1; set({ grid:[...grid] });
    }
    if (selectedAction==="water" && t.hasCrop && res.water>0) {
      // riego básico: sube humedad y acelera crecimiento
      t.moisture = Math.min(1, t.moisture + 0.15);
      set({ grid:[...grid], res:{...res, water: Math.max(0, res.water-8), aquifer: Math.max(0, res.aquifer-1)} });
    }
    if (selectedAction==="harvest" && t.hasCrop && t.stage>=5) {
      t.hasCrop = false; t.stage = 0;
      set({ grid:[...grid], res:{...res, score:{...res.score, prod: res.score.prod+1}} });
    }
  },

  setTutorialShown: (shown)=> set({tutorialShown: shown}),
  setRiverTutorialCompleted: (completed)=> set({riverTutorialCompleted: completed}),
  setShopTutorialCompleted: (completed)=> set({shopTutorialCompleted: completed}),
  setSeedTutorialCompleted: (completed)=> set({seedTutorialCompleted: completed}),
  setCloseShopTutorialCompleted: (completed)=> set({closeShopTutorialCompleted: completed}),
  setPlantTutorialCompleted: (completed)=> set({plantTutorialCompleted: completed}),
  setWeatherTutorialCompleted: (completed)=> set({weatherTutorialCompleted: completed}),
  setFinalTutorialCompleted: (completed)=> set({finalTutorialCompleted: completed}),
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

  irrigate() {
    const { isNearRiver, setRiverTutorialCompleted, setPlantTutorialCompleted, player, plots, resources, setWaterTanks, updatePlot } = get();
    if (isNearRiver) setRiverTutorialCompleted(true);

    const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const riverDist = dist(playerCenter.x, playerCenter.y, RIVER_POSITION.x, RIVER_POSITION.y);

    // Check if near river and fill tank
    if (riverDist <= 162) {
      const fillIndex = resources.waterTanks.findIndex(t => t < MAX_TANK_CAPACITY);
      if (fillIndex !== -1) {
        setWaterTanks(prev => {
          const newTanks = [...prev];
          newTanks[fillIndex] = Math.min(MAX_TANK_CAPACITY, newTanks[fillIndex] + 1);
          return newTanks;
        });
      }
    }

    // Check for nearest irrigable plot
    let nearestPlot: Plot | null = null;
    let minDist = Infinity;
    for (const p of plots) {
      console.log('PLOT', p)
      if (p.stage === 0 || p.isIrrigated) continue;
      const plotCenter = { x: p.x + 36, y: p.y + 36 };
      const d = dist(playerCenter.x, playerCenter.y, plotCenter.x, plotCenter.y);
      console.log('DIST', d)
      if (d <= 30 && d < minDist) {
        minDist = d;
        nearestPlot = p;
      }
    }

    if (nearestPlot) {
      const tankIndex = resources.waterTanks.findIndex(t => t > 0);
      console.log('RESOURCES', resources)
      console.log('TANK INDEX', tankIndex)
      if (tankIndex !== -1) {
        setPlantTutorialCompleted(true)
        setWaterTanks(prev => {
          const newTanks = [...prev];
          newTanks[tankIndex] = Math.max(0, newTanks[tankIndex] - 1);
          return newTanks;
        });
        updatePlot(nearestPlot.id, {
          moisture: clamp01(nearestPlot.moisture + MOISTURE_IRRIGATION_DELTA),
          isIrrigated: true
        });
      }
    }
  },
  
  nextTurn: ()=>{
    const { grid, res, weather, drought } = get();
    // recarga acuífero si llueve
    const aquiferGain = weather.rainMm > 3 ? 2 : weather.rainMm>0 ? 1 : 0;
    const newAquifer = Math.min(100, res.aquifer + aquiferGain);

    // actualizar cada parcela
    const nextGrid = grid.map(t=>{
      // evapotranspiración
      const evap = drought ? 0.08 : 0.05;
      let moisture = Math.max(0, Math.min(1, t.moisture - evap + weather.rainMm/50));

      // crecimiento si hay cultivo
      let stage = t.stage;
      if (t.hasCrop) {
        if (moisture >= 0.3 && moisture <= 0.8) {
          // incrementar hasta el máximo de la etapa (0|1)
          stage = Math.min(1, stage + 1) as PlotStage;
        } else if (moisture < 0.15) {
          // decrementar hasta el mínimo (0)
          stage = Math.max(0, stage - 1) as PlotStage;
        }
      }
  return {...t, moisture, stage};
    });

    // nueva predicción y sequía aleatoria
    const nw = nextForecast();
    const ndrought = Math.random()<0.12 ? true : Math.random()<0.6 ? drought : false;

    // sostenibilidad y resiliencia de forma simple
    const sost = res.score.sost + (weather.rainMm>0 && res.water<90 ? 1 : 0);
    const alive = nextGrid.some(t=>t.hasCrop);
    const resil = res.score.res + (alive ? 1 : 0);

    set({
      grid: nextGrid,
      res: { water: res.water, aquifer: newAquifer, turns: res.turns+1, score:{prod:res.score.prod, sost, res:resil} },
      weather: nw,
      drought: ndrought
    });
  },

  rollForecast(){
    const r = Math.random();
    if (r > .7) return { mm: 8 + Math.random()*8, label: "fuerte" as const };
    if (r > .4) return { mm: 3 + Math.random()*3, label: "moderada" as const };
    if (r > .2) return { mm: 0.5 + Math.random()*1.5, label: "ligera" as const };
    return { mm: 0, label: "seca" as const };
  },

  setNumPlots(n){
    set(() => ({ numPlots: n, plots: makePlots(n) }));
  },

  addTank(){ set(s => ({ resources: { ...s.resources, waterTanks: [...s.resources.waterTanks, 0] }})); },

  // utilidades para Shop
  setInventory(inv){ set({ inventory: inv }); },
  setCurrency(v){ set(s => ({ resources: { ...s.resources, currency: v } })); },
  setDecorations(ids){ set({ decorations: ids }); },

  toggleShop() {

    const {showShop, shopTutorialCompleted, closeShopTutorialCompleted, setShopTutorialCompleted, setCloseShopTutorialCompleted} = get()

    if (!showShop && !shopTutorialCompleted) {
          setShopTutorialCompleted(true);
        } else if (!closeShopTutorialCompleted) {
          console.log("close shop");
          setCloseShopTutorialCompleted(true);
    }
    set(s => ({ showShop: !s.showShop }));
  },
  toggleControls(){ set(s => ({ showControls: !s.showControls })); },
  reset: ()=> set({
    grid: makeGrid(),
    res: { water:100, aquifer:60, turns:1, score:{prod:0,sost:0,res:0} },
    weather: nextForecast(),
    drought:false,
    selectedAction:null,
    tutorialShown: false,
    riverTutorialCompleted: false,
    shopTutorialCompleted: false,
    seedTutorialCompleted: false,
    closeShopTutorialCompleted: false,
    plantTutorialCompleted: false,
    weatherTutorialCompleted: false,
    finalTutorialCompleted: false,
      selectedRegion: "",
      selectedDistrict: "",
      playerName: ""
  })
}));
