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
import type { Inventory } from "../game/core/types";
import Shop from "../components/Shop";

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
  const [waterTanks, setWaterTanks] = useState<number[]>([0]); // start with 1 tank at full
  const [numPlots, setNumPlots] = useState(1); // start with 1 plot
  const [turn, setTurn] = useState(1);
  const [forecast, setForecast] = useState(() => rollForecast());

  // grid based on numPlots
  const [plots, setPlots] = useState<Plot[]>(() => makePlots(numPlots));

  // parcela "cercana" para interactuar
  const nearest = useMemo(() => nearestPlot(pos, plots), [pos, plots]);

  // inventario y tienda
  const [currency, setCurrency] = useState(100);
  const [inventory, setInventory] = useState<Inventory>([
    { id: 'seed1', name: 'Corn Seed', type: 'seed', quantity: 5, price: 10, icon: '🌽' },
    { id: 'crop', name: 'Corn', type: 'crop', quantity: 1, price: 5, icon: '🌽' }
  ]);
  const [decorations, setDecorations] = useState<string[]>([]); // owned decoration ids
  const [showShop, setShowShop] = useState(false);
  const [showControls, setShowControls] = useState(false);

  /* ----------------- input ----------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e","r","n","i","escape"].includes(k)) e.preventDefault();
      keys.current[k] = true;

      if (k === "e") plant();
      if (k === "r") irrigate();
      if (k === "n") nextTurn();
      if (k === "escape") setShowShop(!showShop)
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [plots, waterTanks, forecast]);

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
    if (nearest.stage === 5) {
      harvest();
      return;
    }
    if (nearest.stage === 0) {
      const seedItem = inventory.find(item => item.type === 'seed');
      if (!seedItem || seedItem.quantity <= 0) return;
      setPlots(ps => ps.map(p => {
        if (p === nearest && p.stage === 0) return { ...p, stage: 1, moisture: Math.max(p.moisture, 0.25) };
        return p;
      }));
      seedItem.quantity -= 1;
      if (seedItem.quantity === 0) {
        setInventory(inventory.filter(item => item !== seedItem));
      } else {
        setInventory([...inventory]);
      }
    }
  }

  function harvest() {
    if (!nearest || nearest.stage !== 5) return;
    const cropItem = inventory.find(item => item.id === 'crop' && item.type === 'crop');
    if (cropItem) {
      cropItem.quantity += 1;
      setInventory([...inventory]);
    } else {
      setInventory([...inventory, { id: 'crop', name: 'Corn', type: 'crop', quantity: 1, price: 5, icon: '🌽' }]);
    }
    setPlots(ps => ps.map(p => p === nearest ? { ...p, stage: 0, moisture: p.moisture } : p));
  }

  function irrigate() {
    if (!nearest || waterTanks.reduce((a, b) => a + b, 0) <= 0) return;
    setWaterTanks(tanks => {
      const newTanks = [...tanks];
      for (let i = 0; i < newTanks.length; i++) {
        if (newTanks[i] > 0) {
          newTanks[i] = Math.max(0, newTanks[i] - 1);
          break;
        }
      }
      return newTanks;
    });
    setPlots(ps => ps.map(p => {
      if (p === nearest) return { ...p, moisture: Math.min(1, p.moisture + 0.25) };
      return p;
    }));
  }

  function nextTurn() {
    // lluvia recarga humedad en todas las parcelas
    setPlots(ps => ps.map(p => stepGrowth(p, forecast)));
    setTurn(t => t + 1);
    setForecast(rollForecast());
  }

  const nav = useNavigate();

  return (
    <>
      <div className="background">
        <div className="title-banner">Farm4Future - Day {turn}</div>
        <button className="exit-btn" onClick={() => nav("/")}>Salir</button>
      </div>
      <div className="scene">

        {/* HUD - Now shows inventory */}
        <div className="hud-panel">
          <div className="hud-section">
            <h4>Seeds</h4>
            {inventory.filter(item => item.type === 'seed').map(item => (
              <div key={item.id} className="inventory-item">
                {item.icon} {item.name}: {item.quantity}
              </div>
            ))}
          </div>
          <div className="hud-section">
            <h4>Crops</h4>
            {inventory.filter(item => item.type === 'crop').map(item => (
              <div key={item.id} className="inventory-item">
                {item.icon} {item.name}: {item.quantity}
              </div>
            ))}
          </div>
          <div className="hud-section">
            <div className="hud-row"><span className="ico">💧</span><span className="val">{waterTanks.reduce((a, b) => a + b, 0)}</span></div>
            <div className="hud-row"><span className="ico">🪙</span><span className="val">{currency}</span></div>
          </div>
          <div className="hud-buttons">
            <button className="controls-btn" onClick={() => setShowControls(!showControls)}>Controls</button>
            <button className="shop-btn" onClick={() => setShowShop(!showShop)}>Shop</button>
          </div>
          {showControls && (
            <div className="controls-popup">
              <strong>E:</strong> Sow / Harvest<br/>
              <strong>R:</strong> Irrigate / Regar<br/>
              <strong>N:</strong> Turn / Turno<br/>
              <strong>ESC:</strong> Shop
            </div>
          )}
        </div>

        <Shop currency={currency} setCurrency={setCurrency} inventory={inventory} setInventory={setInventory} numPlots={numPlots} setNumPlots={setNumPlots} waterTanks={waterTanks} setWaterTanks={setWaterTanks} plots={plots} setPlots={setPlots} decorations={decorations} setDecorations={setDecorations} show={showShop} onClose={() => setShowShop(false)} />

        {/* Pronóstico */}
        <div className="rain-panel">
          <div className="rain-ico" data-level={forecast.label} />
          <div className="rain-label">Rain: {forecast.label} ({forecast.mm.toFixed(1)}mm)</div>
        </div>

        {/* Rio */}
        <div className="river" />

        {/* Tanques de agua */}
        <div className="tank-container">
          {waterTanks.map((level, i) => (
            <div key={i} className="tank">
              {level > 0 && (
                <div className="water" style={{ height: `${(level / 10) * 100}%` }} />
              )}
              <div className="tank-label">{level}/10</div>
            </div>
          ))}
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

        {/* decorativos */}
        <div className="decorative">
          {decorations.map((dec, i) => (
            <div key={i} className="tree">
              <img src={ASSETS.tree} alt="Decoration" width={70}/>
            </div>
          ))}
        </div>
      </div>
    </>
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
function makePlots(numPlots: number): Plot[] {
  const out: Plot[] = [];
  const origin = { x: 520, y: 390 };
  const cols = 3; // max columns
  let idx = 0;
  for (let r = 0; r < Math.ceil(numPlots / cols); r++) {
    for (let c = 0; c < cols && idx < numPlots; c++) {
      out.push({
        x: origin.x + c * 86,
        y: origin.y + r * 86,
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
