import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Shop from "../components/Shop";
import ClimatePanel from "../components/ClimatePanel";
import { HUDPanel } from "../components/HUDPanel";
import { Player } from "../components/Player";
import { Plots } from "../components/Plots";
import { Tanks } from "../components/Tanks"
import { Decorations } from "../components/Decorations";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useGameActions } from "../hooks/useGameActions";
import { useGame } from "../game/state/store";
import "./game.css";
import ASSETS from "../assets/gameAssets";
import River from "../components/River";

const PLAYER = { w: 65, h: 105, speed: 250 };

// Rio coordinates
const RIVER_X = -150;
const RIVER_Y = 0; // bottom
const RIVER_WIDTH = 390;
const RIVER_HEIGHT = 650;
const RIVER_CENTER_X = RIVER_X + RIVER_WIDTH / 2;
const RIVER_CENTER_Y = 450; // scene height 630

export default function Game() {
  // Use hooks for state and logic
  const { player, frameFarmer } = usePlayerMovement();
  const { setCurrency, setDecorations, toggleControls, setNumPlots, toggleShop } = useGameActions();
  const {
    showShop,
    showControls,
    resources,
    forecast,
    plots,
    decorations,
    inventory,
    tutorialShown,
    riverTutorialCompleted,
    shopTutorialCompleted,
    seedTutorialCompleted,
    setSeedTutorialCompleted,
    closeShopTutorialCompleted,
    plantTutorialCompleted,
    weatherTutorialCompleted,
    setWeatherTutorialCompleted,
    setFinalTutorialCompleted,
    finalTutorialCompleted,
    nearestId,
    setPlots,
    setInventory,
    setWaterTanks,
    numPlots } = useGame();

  // const [frameFarmer, setFrameFarmer] = useState(ASSETS.farmerWalk)
  // const [facingRight, setFacingRight] = useState(false);
  // const facingRightRef = useRef(facingRight);
  // useEffect(() => { facingRightRef.current = facingRight; }, [facingRight]);

  // const [forecast, setForecast] = useState<{ mm: number; label: "fuerte" | "moderada" | "ligera" | "seca" }>(() => ({ mm: 0.5 + Math.random()*1.5, label: "ligera" as const }));

  // grid based on numPlots
  // const [plots, setPlots] = useState<Plot[]>(() => makePlots(numPlots));
  const plotsRef = useRef(plots);

  // cerca del río para recolectar agua
  const isNearRiver = useMemo(() => {
    const playerCenterX = player.x + PLAYER.w / 2;
    const playerCenterY = player.y + PLAYER.h / 2;
    return (Math.hypot(playerCenterX-RIVER_CENTER_X, playerCenterY-RIVER_CENTER_Y) < 200);
  }, [player]);

  useEffect(() => { plotsRef.current = plots; }, [plots]);
  const forecastRef = useRef(forecast);
  useEffect(() => { forecastRef.current = forecast; }, [forecast]);
  const isNearRiverRef = useRef(isNearRiver);
  useEffect(() => { isNearRiverRef.current = isNearRiver; }, [isNearRiver]);

  const showShopRef = useRef(showShop);
  useEffect(() => { showShopRef.current = showShop; }, [showShop]);

  /* ----------------- acciones ----------------- */

  const nav = useNavigate();

  const riverImage = forecast.label === 'fuerte' || forecast.label === 'moderada' ? ASSETS.riverImg : forecast.label === 'ligera' ? ASSETS.lowerRiverImg : ASSETS.dryRiverImg;

  return (
    <>
      <div className="background">
        <div className="title-banner">F4F - Month {resources.turn}</div>
        <button className="exit-btn" onClick={() => { if (window.confirm("¿Estás seguro de que quieres salir? Perderás tu progreso.")) { nav("/"); } }}>Salir</button>
      </div>
      <div className="scene">
        <HUDPanel showControls={showControls} setShowControls={toggleControls} />

        <Shop
          currency={resources.currency}
          setCurrency={setCurrency}
          inventory={inventory}
          setInventory={setInventory}
          numPlots={numPlots}
          setNumPlots={setNumPlots} // CORREGIDO () => {}
          waterTanks={resources.waterTanks}
          setWaterTanks={setWaterTanks} // CORREGIDO () => {}
          plots={plots}
          setPlots={setPlots} // CORREGIDO () => {}
          decorations={decorations}
          setDecorations={setDecorations}
          show={showShop}
          onClose={() => toggleShop()}
          onSeedBought={() => setSeedTutorialCompleted(true)}
          seedTutorialCompleted={seedTutorialCompleted} />

        {/* Climate panel */}
        <ClimatePanel currentTurn={resources.turn} currentForecast={forecast} onExpand={() => setWeatherTutorialCompleted(true)} isWeatherTutorialActive={plantTutorialCompleted && !weatherTutorialCompleted} />

        {/* Pronóstico */}
        <River forecast={forecast} player={player} />
        
        {/* Rio */}
        <img src={riverImage} alt="River" className={`river ${isNearRiver ? "focus" : ""}`} style={{ left: RIVER_X, bottom: RIVER_Y, width: RIVER_WIDTH, height: RIVER_HEIGHT }} />

        <Player player={player} frameFarmer={frameFarmer} nearest={!!nearestId()} finalTutorialCompleted={finalTutorialCompleted} />

        {/* Tanques de agua */}
        <Tanks />
        
        <Plots plots={plots} nearestId={nearestId() || undefined} />

        <Decorations decorations={decorations} />

        
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
          }>finish the tutorial</button>
        </div>
      )}
      </div>
    </>
  )
}

