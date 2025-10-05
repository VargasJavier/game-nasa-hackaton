import { useEffect, useMemo, useRef, useState } from "react";
import "./game.css";
import farmer from '../assets/icons/farmer.png'
import farmerInvert from '../assets/icons/farmerInvert.png'
import farmerWalk from '../assets/icons/farmerWalk.gif'
import farmerWalkInvert from '../assets/icons/farmerWalkInvert.gif'
import tree from '../assets/icons/JungleTree.png'
import texture1 from "../assets/icons/WoodTexture1.png"
import texture2 from "../assets/icons/WoodTexture2.png"
import texture3 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture4 from "../assets/icons/FarmLandOnTopvariant2.png"
import texture5 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture6 from "../assets/icons/FarmLandOnTopvariant2.png"
import stageIrrigate from "../assets/icons/WoodTexture2.png" // placeholder for irrigate image
import riverImg from '../assets/icons/river.webp'
import lowerRiverImg from '../assets/icons/lowerRiiver.webp'
import dryRiverImg from '../assets/icons/dryRiiver.webp'
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Inventory } from "../game/core/types";
import Shop from "../components/Shop";
import ClimatePanel from "../components/ClimatePanel";
import TurnCounter from "../components/HUD/TurnCounter";
import { useGame } from "../game/state/store";

/** ---------------------------
 *  Config rápida de “assets”
 *  Reemplaza rutas si ya tienes tus PNGs
 *  --------------------------- */
const ASSETS = {
  farmerIdle: farmer,
  farmerIdleInvert: farmerInvert,
  farmerWalk: farmerWalk,
  farmerWalkInvert: farmerWalkInvert,
  tree: tree,
  plotStages: [
    texture1, // tierra
    texture2, // brote
    texture3, // pequeño
    texture4, // medio
    texture5, // maduro
    texture6, // dorado/cosecha
  ],
  stageIrrigate: stageIrrigate, // imagen para cuando la parcela está regada
};

type Plot = {
  x: number; y: number;           // posición absoluta en px
  stage: 0|1|2|3|4|5;             // 0 tierra → 5 cosecha
  moisture: number;               // 0..1 humedad local
  alive: boolean;
  isIrrigated: boolean;           // si la parcela ha sido regada recientemente
};

// visual sprite is 65x105 (see CSS), keep PLAYER in sync so detection uses correct center
const PLAYER = { w: 65, h: 105, speed: 250 };

// Rio coordinates
const RIVER_X = -150;
const RIVER_Y = 0; // bottom
const RIVER_WIDTH = 390;
const RIVER_HEIGHT = 650;
const RIVER_CENTER_X = RIVER_X + RIVER_WIDTH / 2;
const RIVER_CENTER_Y = 450; // scene height 630

export default function Game() {
   // jugador
   const [pos, setPos] = useState({ x: 360, y: 430 });
   const posRef = useRef(pos);
   const keys = useRef<Record<string, boolean>>({});
   const raf = useRef<number | null>(null);
   const last = useRef<number>(performance.now());
   const [frameFarmer, setFrameFarmer] = useState(ASSETS.farmerIdle)
   const [facingRight, setFacingRight] = useState(false);
   const facingRightRef = useRef(facingRight);
   useEffect(() => { facingRightRef.current = facingRight; }, [facingRight]);

  // recursos y clima
  const [waterTanks, setWaterTanks] = useState<number[]>([0]); // start with 1 tank
  const [numPlots, setNumPlots] = useState(1); // start with 1 plot
  const [turn, setTurn] = useState(1);
  const [forecast, setForecast] = useState<{ mm: number; label: "fuerte" | "moderada" | "ligera" | "seca" }>(() => ({ mm: 0.5 + Math.random()*1.5, label: "ligera" as const }));

  // grid based on numPlots
  const [plots, setPlots] = useState<Plot[]>(() => makePlots(numPlots));
  const plotsRef = useRef(plots);

  // parcela "cercana" para interactuar
  const nearest = useMemo(() => nearestPlot(pos, plots), [pos, plots]);

  // cerca del río para recolectar agua
  const isNearRiver = useMemo(() => {
    const playerCenterX = pos.x + PLAYER.w / 2;
    const playerCenterY = pos.y + PLAYER.h / 2;
    return dist(playerCenterX, playerCenterY, RIVER_CENTER_X, RIVER_CENTER_Y) < 200;
  }, [pos]);

  // debug: show player coordinates and nearest plot in console when they change
  // useEffect(() => {
  //   console.log('Player pos ->', pos);
  //   console.log('Nearest plot ->', nearest);
  // }, [pos, nearest]);

  // keep refs up-to-date so handlers/readers can use latest values without
  // requiring re-binding of event listeners on every state change
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { plotsRef.current = plots; }, [plots]);
  const forecastRef = useRef(forecast);
  useEffect(() => { forecastRef.current = forecast; }, [forecast]);
  const isNearRiverRef = useRef(isNearRiver);
  useEffect(() => { isNearRiverRef.current = isNearRiver; }, [isNearRiver]);
  // inventario y tienda
  const [currency, setCurrency] = useState(100000);
  const [inventory, setInventory] = useState<Inventory>([
    { id: 'seed1', name: 'Corn Seed', type: 'seed', quantity: 5, price: 10, icon: '🌽' },
    { id: 'crop', name: 'Corn', type: 'crop', quantity: 1, price: 5, icon: '🌽' }
  ]);
  const [decorations, setDecorations] = useState<string[]>([]); // owned decoration ids
  const [showShop, setShowShop] = useState(false);
  const showShopRef = useRef(showShop);
  useEffect(() => { showShopRef.current = showShop; }, [showShop]);
  const [showControls, setShowControls] = useState(false);

  /* ----------------- input ----------------- */
  useEffect(() => {
    // attach once; handlers will read latest state via refs
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e","r","i","escape"].includes(k)) e.preventDefault();
      keys.current[k] = true;

      if (!tutorialShown && ["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k)) {
        setTutorialShown(true);
      }

      if (k === "arrowleft" || k === "a") setFacingRight(false);
      if (k === "arrowright" || k === "d") setFacingRight(true);

      if (k === "e") {
        // call action reading latest pos/plots via refs inside function
          plant();
      }
      if (k === "r") {
        if (isNearRiverRef.current) {
          collectWater();
        } else {
          irrigate();
        }
      }
      if (k === "escape") {
        const wasOpen = showShopRef.current;
        setShowShop(s => !s);
        if (!wasOpen && !shopTutorialCompleted) {
          setShopTutorialCompleted(true);
        } else if (!closeShopTutorialCompleted) {
          console.log("close shop");
          setCloseShopTutorialCompleted(true);
        }
      }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  /* ----------------- loop ----------------- */
  useEffect(() => {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last.current) / 1000);
      last.current = t;

      let dx = 0, dy = 0;
      if (keys.current["arrowleft"] || keys.current["a"]) dx -= 1;
      if (keys.current["arrowright"] || keys.current["d"]) dx += 1;
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
      const isMoving = !!(dx || dy);
      setFrameFarmer(isMoving ? (facingRightRef.current ? ASSETS.farmerWalkInvert : ASSETS.farmerWalk) : (facingRightRef.current ? ASSETS.farmerIdleInvert : ASSETS.farmerIdle));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  /* ----------------- acciones ----------------- */
  function plant() {
    // read latest from refs
    const posNow = posRef.current;
    const plotsNow = plotsRef.current;
    const n = nearestPlot(posNow, plotsNow);
    console.log('plant -> nearest', n);
    if (!n) return;
    if (n.stage === 5) {
      harvest();
      return;
    }
    if (n.stage === 0) {
      const seedItem = inventory.find(item => item.type === 'seed');
      if (!seedItem || seedItem.quantity <= 0) return;
      setPlots(ps => ps.map(p => {
        if (p.x === n.x && p.y === n.y && p.stage === 0) return { ...p, stage: 1, moisture: Math.max(p.moisture, 0.25) };
        return p;
      }));
      seedItem.quantity -= 1;
      if (seedItem.quantity === 0) {
        setInventory(inventory.filter(item => item !== seedItem));
      } else {
        setInventory([...inventory]);
      }
      if (!plantTutorialCompleted) {
        setPlantTutorialCompleted(true);
      }
    } else if (n.stage > 0 && n.stage < 5) {
      // allow manual advancement by 1 stage when pressing E on an already planted plot
      setPlots(ps => ps.map(p => {
        if (p.x === n.x && p.y === n.y && p.stage > 0 && p.stage < 5) {
          return { ...p, stage: (p.stage + 1) as Plot['stage'], moisture: Math.min(1, p.moisture + 0.1) };
        }
        return p;
      }));
    }
  }

  function harvest() {
    const n = nearestPlot(posRef.current, plotsRef.current);
    if (!n || n.stage !== 5) return;
    const cropItem = inventory.find(item => item.id === 'crop' && item.type === 'crop');
    if (cropItem) {
      cropItem.quantity += 1;
      setInventory([...inventory]);
    } else {
      setInventory([...inventory, { id: 'crop', name: 'Corn', type: 'crop', quantity: 1, price: 5, icon: '🌽' }]);
    }
    setPlots(ps => ps.map(p => (p.x === n.x && p.y === n.y) ? { ...p, stage: 0, moisture: p.moisture } : p));
  }

  function irrigate() {
    const n = nearestPlot(posRef.current, plotsRef.current);
    if (!n || n.stage < 2 || waterTanks.reduce((a, b) => a + b, 0) <= 0) return;
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
      if (p.x === n.x && p.y === n.y) return { ...p, moisture: Math.min(1, p.moisture + 0.25), isIrrigated: true };
      return p;
    }));
  }

  function collectWater() {
    if (forecastRef.current.label !== 'seca') {
      let collected = false;
      setWaterTanks(tanks => {
        const newTanks = [...tanks];
        for (let i = 0; i < newTanks.length; i++) {
          if (newTanks[i] < 10) {
            newTanks[i] += 1;
            collected = true;
            break;
          }
        }
        return newTanks;
      });
      if (collected) {
        setRiverTutorialCompleted(true);
      }
    }
  }

  function nextTurn() {
    // lluvia recarga humedad en todas las parcelas; use latest forecastRef
    setPlots(ps => ps.map(p => ({ ...stepGrowth(p, forecastRef.current), isIrrigated: false })));
    setTurn(t => t + 1);
    const newFc = rollForecast();
    setForecast(newFc);
    forecastRef.current = newFc;
  }

  const nav = useNavigate();

  const tutorialShown = useGame(state => state.tutorialShown);
  const setTutorialShown = useGame(state => state.setTutorialShown);
  const riverTutorialCompleted = useGame(state => state.riverTutorialCompleted);
  const setRiverTutorialCompleted = useGame(state => state.setRiverTutorialCompleted);
  const shopTutorialCompleted = useGame(state => state.shopTutorialCompleted);
  const setShopTutorialCompleted = useGame(state => state.setShopTutorialCompleted);
  const seedTutorialCompleted = useGame(state => state.seedTutorialCompleted);
  const setSeedTutorialCompleted = useGame(state => state.setSeedTutorialCompleted);
  const closeShopTutorialCompleted = useGame(state => state.closeShopTutorialCompleted);
  const setCloseShopTutorialCompleted = useGame(state => state.setCloseShopTutorialCompleted);
  const plantTutorialCompleted = useGame(state => state.plantTutorialCompleted);
  const setPlantTutorialCompleted = useGame(state => state.setPlantTutorialCompleted);
  const weatherTutorialCompleted = useGame(state => state.weatherTutorialCompleted);
  const setWeatherTutorialCompleted = useGame(state => state.setWeatherTutorialCompleted);
  const finalTutorialCompleted = useGame(state => state.finalTutorialCompleted);
  const setFinalTutorialCompleted = useGame(state => state.setFinalTutorialCompleted);
  const playerName = useGame(state => state.playerName);
  const setPlayerName = useGame(state => state.setPlayerName);
  const selectedDistrict = useGame(state => state.selectedDistrict);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     e.returnValue = "¿Estás seguro de que quieres recargar o cambiar de página? Perderás tu progreso.";
  //   };
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);



  const riverImage = forecast.label === 'fuerte' || forecast.label === 'moderada' ? riverImg : forecast.label === 'ligera' ? lowerRiverImg : dryRiverImg;

  return (
    <>
      <div className="background">
        <div className="title-banner">{playerName} - Month {turn}</div>
        <button className="exit-btn" onClick={() => { if (window.confirm("¿Estás seguro de que quieres salir? Perderás tu progreso.")) { nav("/"); } }}>Salir</button>
      </div>
      <div className="scene">
        {/* HUD - Now shows inventory */}
        <div className="hud-panel">
          <TurnCounter currentTurn={turn} onNextTurn={nextTurn} />
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
            <button className="shop-btn" onClick={() => { setShowShop(s => !s);  }}>Shop</button>
          </div>
          {showControls && (
            <div className="controls-popup">
              <strong>E:</strong> Sow / Harvest / Collect Water<br/>
              <strong>R:</strong> Irrigate / Regar<br/>
              <strong>ESC:</strong> Shop
            </div>
          )}
        </div>

        <Shop currency={currency} setCurrency={setCurrency} inventory={inventory} setInventory={setInventory} numPlots={numPlots} setNumPlots={setNumPlots} waterTanks={waterTanks} setWaterTanks={setWaterTanks} plots={plots} setPlots={setPlots} decorations={decorations} setDecorations={setDecorations} show={showShop} onClose={() => setShowShop(false)} onSeedBought={() => setSeedTutorialCompleted(true)} seedTutorialCompleted={seedTutorialCompleted} />

        <ClimatePanel currentTurn={turn} currentForecast={forecast} onExpand={() => setWeatherTutorialCompleted(true)} isWeatherTutorialActive={plantTutorialCompleted && !weatherTutorialCompleted} selectedDistrict={selectedDistrict} />

        {/* Rio */}
        <img src={riverImage} alt="River" className={`river ${isNearRiver ? "focus" : ""}`} style={{ left: RIVER_X, bottom: RIVER_Y, width: RIVER_WIDTH, height: RIVER_HEIGHT }} />

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
      <div className={`player ${nearest ? "near" : ""} ${!finalTutorialCompleted ? "tutorial" : ""}`} style={{ left: pos.x, top: pos.y }}>
        {/* si tienes sprite, descomenta: */}
        <img src={frameFarmer} alt="Personaje" width={65}/>
      </div>

      {/* Parcelas */}
      <div className="plots">
        {plots.map((p, i) => (
          <div
            key={i}
            className={`plot ${(nearest && p.x === nearest.x && p.y === nearest.y) ? "focus" : ""} ${!p.alive ? "dead" : ""}`}
            style={{ left: p.x, top: p.y }}
          >
            {p.isIrrigated
              ? <img src={ASSETS.stageIrrigate} alt="" draggable={false} width={65} height={65}/>
              : ASSETS.plotStages[p.stage]
                ? <img src={ASSETS.plotStages[p.stage]} alt="" draggable={false} width={65} height={65}/>
                : <div className={`sprout s${p.stage}`} />}
          </div>
        ))}
      </div>

        {/* decorativos */}
        <div className="decorative">
          {decorations.map((_, i) => (
            <div key={i} className="tree">
              <img src={ASSETS.tree} alt="Decoration" width={70}/>
            </div>
          ))}
        </div>
      </div>

      {!tutorialShown && (
        <div className="tutorial-modal">
          Use WASD or arrow keys (↑ → ↓ ←) to move around the map.
        </div>
      )}

      {tutorialShown && !riverTutorialCompleted && (
        <div className="tutorial-modal">
          Go to the river and press R to collect water.
        </div>
      )}

      {riverTutorialCompleted && !shopTutorialCompleted && (
        <div className="tutorial-modal">
          Open the shop whit ESC.
        </div>
      )}

      {seedTutorialCompleted && !closeShopTutorialCompleted && (
        <div className="tutorial-modal zindex">
          Close the shop whit ESC and go to the available plot.
        </div>
      )}

      {closeShopTutorialCompleted && !plantTutorialCompleted && (
        <div className="tutorial-modal">
          Go to the plot and press E to plant and R to water.
        </div>
      )}

      {plantTutorialCompleted && !weatherTutorialCompleted && (
        <div className="tutorial-modal">
          Clic on the phone to open
        </div>
      )}

      {weatherTutorialCompleted && !finalTutorialCompleted && (
        <div className="tutorial-modal">
          <p>With the cell phone you can see the weather in the following months.</p>
          <p>You have a limit of 5 actions per month.</p>
          <p>You can skip the month with the Skip Time button at the top.</p>
          <p>Get luck.</p>
          <button
          onClick={() => {
            setFinalTutorialCompleted(true);
          }
          }>Finish the tutorial</button>
        </div>
      )}
    </>
  );
}

/* ----------------- helpers ----------------- */
function clampToScene(p:{x:number;y:number}){
  // limits requested: X up to 1090, Y up to 663
  const MAX_X = 1090;
  const MAX_Y = 663;
  return {
    x: Math.max(0, Math.min(MAX_X - PLAYER.w, p.x)),
    y: Math.max(0, Math.min(MAX_Y - PLAYER.h, p.y)),
  };
}
function dist(ax:number,ay:number,bx:number,by:number){ return Math.hypot(ax-bx, ay-by); }
function nearestPlot(player:{x:number;y:number}, plots:Plot[]){
  let best: Plot | null = null, bestD = Infinity;
  for (const p of plots) {
    // center of player vs center of plot (plot visual is 72x72, so +36)
    const d = dist(player.x + PLAYER.w/2, player.y + PLAYER.h/2, p.x + 36, p.y + 36);
    // console.log('PLOTS D', d)
    if (d < bestD && d < 90) {
      // console.log('PLOTS TRUE')
      best = p;
      bestD = d;
    }
  }
  // console.log('RETURN NEARESTPLOT', best)
  return best;
}
function makePlots(numPlots: number): Plot[] {
  const out: Plot[] = [];
  const origin = { x: 350, y: 250 };
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
        isIrrigated: false,
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
