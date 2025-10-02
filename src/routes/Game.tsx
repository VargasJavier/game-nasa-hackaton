import { useEffect, useMemo, useRef, useState } from "react";
import "./game.css";
import farmer from '../assets/icons/farmer.png'
import farmerInvert from '../assets/icons/farmerInvert.png'
import tree from '../assets/icons/JungleTree.png'
import texture1 from "../assets/icons/WoodTexture1.png"
import texture2 from "../assets/icons/WoodTexture2.png"
import texture3 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture4 from "../assets/icons/FarmLandOnTopvariant2.png"
import texture5 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture6 from "../assets/icons/FarmLandOnTopvariant2.png"
import React from "react";
import { useNavigate } from "react-router-dom";

/** ---------------------------
 *  Config rápida de “assets”
 *  Reemplaza rutas si ya tienes tus PNGs
 *  --------------------------- */
const ASSETS = {
  farmerIdle: farmer,
  farmerIdleInvert: farmerInvert,
  tree: tree,
  plotStages: [
    texture1, // tierra
    texture2, // brote
    texture3, // pequeño
    texture4, // medio
    texture5, // maduro
    texture6, // dorado/cosecha
  ],
};

type Plot = {
  x: number; y: number;           // posición absoluta en px
  stage: 0|1|2|3|4|5;             // 0 tierra → 5 cosecha
  moisture: number;               // 0..1 humedad local
  alive: boolean;
};

const SCENE = { w: 1152, h: 768 };
const PLAYER = { w: 38, h: 48, speed: 200 };

export default function Game() {
  // jugador
  const [pos, setPos] = useState({ x: 360, y: 430 });
  const keys = useRef<Record<string, boolean>>({});
  const raf = useRef<number | null>(null);
  const last = useRef<number>(performance.now());
  const [frameFarmer, setFrameFarmer] = useState(ASSETS.farmerIdle)

  // recursos y clima
  const [waterTank, setWaterTank] = useState(25);
  const [turn, setTurn] = useState(1);
  const [forecast, setForecast] = useState(() => rollForecast());

  // grid 3x3 de parcelas
  const [plots, setPlots] = useState<Plot[]>(() => makePlots());

  // parcela “cercana” para interactuar
  const nearest = useMemo(() => nearestPlot(pos, plots), [pos, plots]);

  /* ----------------- input ----------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e","r","n"].includes(k)) e.preventDefault();
      keys.current[k] = true;

      if (k === "e") plant();
      if (k === "r") irrigate();
      if (k === "n") nextTurn();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [plots, waterTank, forecast]);

  /* ----------------- loop ----------------- */
  useEffect(() => {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last.current) / 1000);
      last.current = t;

      let dx = 0, dy = 0;
      if (keys.current["arrowleft"] || keys.current["a"]) {
        dx -= 1;
        // use functional updater so we always compare/update against the latest state
        setFrameFarmer(prev => prev === ASSETS.farmerIdle ? prev : ASSETS.farmerIdle);
      }
      if (keys.current["arrowright"] || keys.current["d"]) {
        dx += 1;
        // use functional updater so we always compare/update against the latest state
        setFrameFarmer(prev => prev === ASSETS.farmerIdleInvert ? prev : ASSETS.farmerIdleInvert);
      }
      if (keys.current["arrowup"] || keys.current["w"]) dy -= 1;
      if (keys.current["arrowdown"] || keys.current["s"]) dy += 1;

      if (dx || dy) {
        const len = Math.hypot(dx, dy);
        dx /= len || 1; dy /= len || 1;
        setPos(p => clampToScene({
          x: p.x + dx * PLAYER.speed * dt,
          y: p.y + dy * PLAYER.speed * dt
        }));
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  /* ----------------- acciones ----------------- */
  function plant() {
    if (!nearest) return;
    setPlots(ps => ps.map(p => {
      if (p === nearest && p.stage === 0) return { ...p, stage: 1, moisture: Math.max(p.moisture, 0.25) };
      return p;
    }));
  }

  function irrigate() {
    if (!nearest || waterTank <= 0) return;
    setWaterTank(w => Math.max(0, w - 1));
    setPlots(ps => ps.map(p => {
      if (p === nearest) return { ...p, moisture: Math.min(1, p.moisture + 0.25) };
      return p;
    }));
  }

  function nextTurn() {
    // lluvia recarga humedad en todas las parcelas y tanque si llueve fuerte
    setPlots(ps => ps.map(p => stepGrowth(p, forecast)));
    if (forecast.mm >= 5) setWaterTank(w => Math.min(99, w + 2));
    setTurn(t => t + 1);
    setForecast(rollForecast());
  }

  /* ----------------- métricas ----------------- */
  const ndvi = useMemo(() => {
    const planted = plots.filter(p => p.stage > 0 && p.alive);
    if (!planted.length) return 0;
    // proxy de “salud”: stage/5 ponderado por humedad
    return Math.min(1, planted.reduce((s,p)=> s + (p.stage/5) * (0.5 + 0.5*p.moisture), 0) / planted.length);
  }, [plots]);

  const aliveCrops = plots.filter(p => p.stage > 0 && p.alive).length;

const nav = useNavigate();
  return (
    <div className="scene">
      <div className="title-banner">F4F: Farm4Future</div>
      <button className="exit-btn" onClick={() => nav("/")}>Salir</button>

      {/* HUD */}
      <div className="hud-panel">
        <div className="hud-row"><span className="ico">💧</span><span className="val">{waterTank}</span></div>
        <div className="hud-row"><span className="ico">🗓️</span><span className="val">{turn}</span></div>
        <div className="hud-row"><span className="ico">🌱</span><span className="val">{Math.round(ndvi*100)}</span></div>
        <div className="hint"><strong>E:</strong> Sow / Sembrar</div>
        <div className="hint"><strong>R:</strong> Irrigate / Regar</div>
        <div className="hint"><strong>N:</strong> Turn / Turno</div>
      </div>

      {/* Pronóstico */}
      <div className="rain-panel">
        <div className="rain-ico" data-level={forecast.label} />
        <div className="rain-label">Rain: {forecast.label} ({forecast.mm.toFixed(1)}mm)</div>
      </div>

      {/* Lago decorativo */}
      <div className="lake" />

      {/* Tanques de agua */}
      <div className="tank-container">
        <div className="tank" />
        <div className="tank">
          <div className="water" />
        </div>
      </div>

      {/* Jugador */}
      <div className={`player ${nearest ? "near" : ""}`} style={{ left: pos.x, top: pos.y }}>
        {/* si tienes sprite, descomenta: */}
        <img src={frameFarmer} alt="Personaje" width={120}/>
      </div>

      {/* Parcelas */}
      <div className="plots">
        {plots.map((p, i) => (
          <div
            key={i}
            className={`plot ${nearest === p ? "focus" : ""} ${!p.alive ? "dead" : ""}`}
            style={{ left: p.x, top: p.y }}
          >
            {ASSETS.plotStages[p.stage]
              ? <img src={ASSETS.plotStages[p.stage]} alt="" draggable={false} width={65} height={65}/>
              : <div className={`sprout s${p.stage}`} />}
          </div>
        ))}
      </div>

      {/* Árboles a la derecha (decorativo) */}
      <div className="trees">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tree">
            <img src={ASSETS.tree} alt="Personaje" width={70}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------- helpers ----------------- */
function clampToScene(p:{x:number;y:number}){
  return {
    x: Math.max(0, Math.min(SCENE.w - PLAYER.w, p.x)),
    y: Math.max(0, Math.min(SCENE.h - PLAYER.h, p.y)),
  };
}
function dist(ax:number,ay:number,bx:number,by:number){ return Math.hypot(ax-bx, ay-by); }
function nearestPlot(player:{x:number;y:number}, plots:Plot[]){
  let best: Plot | null = null, bestD = Infinity;
  for (const p of plots){
    const d = dist(player.x+PLAYER.w/2, player.y+PLAYER.h/2, p.x+36, p.y+36);
    if (d < bestD && d < 90) { best = p; bestD = d; }
  }
  return best;
}
function makePlots(): Plot[] {
  const out: Plot[] = [];
  const origin = { x: 520, y: 390 };
  let idx = 0;
  for (let r=0;r<3;r++){
    for (let c=0;c<3;c++){
      out.push({
        x: origin.x + c*86,
        y: origin.y + r*86,
        stage: 0,
        moisture: 0.25,
        alive: true,
      });
      idx++;
    }
  }
  return out;
}
function stepGrowth(p: Plot, fc: { mm:number; label:string }) : Plot {
  if (!p.alive) return p;
  // lluvia aumenta humedad
  const rainMoisture = fc.mm / 20; // 5mm ⇒ +0.25 aprox
  let moisture = Math.max(0, Math.min(1, p.moisture + rainMoisture - 0.15)); // evapo por turno
  let stage = p.stage;

  // si está plantado, crece si humedad en rango útil
  if (stage > 0 && stage < 5){
    if (moisture >= 0.3 && moisture <= 0.85) stage++;
    else if (moisture < 0.15) { // estrés fuerte
      if (stage > 1) stage--;   // retrocede
    }
  }
  // muerte por sequía prolongada
  let alive: boolean = p.alive;
  if (moisture <= 0.05 && stage > 0) alive = false;

  return { ...p, stage: stage as Plot["stage"], moisture, alive };
}
function rollForecast(){
  const r = Math.random();
  if (r > .7) return { mm: 8 + Math.random()*8, label: "fuerte" as const };
  if (r > .4) return { mm: 3 + Math.random()*3, label: "moderada" as const };
  if (r > .2) return { mm: 0.5 + Math.random()*1.5, label: "ligera" as const };
  return { mm: 0, label: "seca" as const };
}
