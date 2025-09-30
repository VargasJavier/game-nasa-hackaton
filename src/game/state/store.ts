import { create } from "zustand";

// export type PlotStage = 0|1|2|3|4|5; // 0 suelo, 1 brote… 5 dorado/cosecha
export type PlotStage = 0|1; // 0 suelo, 1 brote… 5 dorado/cosecha
export type Tile = { id:number; x:number; y:number; stage:PlotStage; moisture:number; hasCrop:boolean; };

type Weather = { label:string; rainMm:number; prob:number; };
type Resources = { water:number; aquifer:number; turns:number; score:{prod:number;sost:number;res:number} };

type GameState = {
  grid: Tile[];
  res: Resources;
  weather: Weather;
  drought: boolean;
  selectedAction: "plant" | "water" | "harvest" | null;

  nextTurn: () => void;
  setAction: (a:GameState["selectedAction"]) => void;
  actOnTile: (id:number) => void;
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

export const useGame = create<GameState>((set, get) => ({
  grid: makeGrid(),
  res: { water:100, aquifer:60, turns:1, score:{prod:0,sost:0,res:0} },
  weather: nextForecast(),
  drought: false,
  selectedAction: null,

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

  reset: ()=> set({
    grid: makeGrid(),
    res: { water:100, aquifer:60, turns:1, score:{prod:0,sost:0,res:0} },
    weather: nextForecast(),
    drought:false,
    selectedAction:null
  })
}));
