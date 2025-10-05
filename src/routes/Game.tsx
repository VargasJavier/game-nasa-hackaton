import React from "react";
import { useNavigate } from "react-router-dom";
import Shop from "../components/Shop";
import { HUDPanel } from "../components/HUDPanel";
import { Player } from "../components/Player";
import { Plots } from "../components/Plots";
import { Tanks } from "../components/Tanks"
import { Decorations } from "../components/Decorations";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useGameActions } from "../hooks/useGameActions";
import { useGame } from "../game/state/store";
import "./game.css";


export default function Game() {
  // Use hooks for state and logic
  const { player, frameFarmer } = usePlayerMovement();
  const { setCurrency, setDecorations, toggleControls } = useGameActions();
  const { showShop, showControls, resources, forecast, plots, decorations, inventory, nearestId, setInventory, numPlots } = useGame();

  const nav = useNavigate();

  return (
    <>
      <div className="background">
        <div className="title-banner">Farm4Future - Day {resources.turn}</div>
        <button className="exit-btn" onClick={() => nav("/")}>Salir</button>
      </div>
      <div className="scene">
        <HUDPanel showControls={showControls} setShowControls={toggleControls} />

        <Shop
          currency={resources.currency}
          setCurrency={setCurrency}
          inventory={inventory}
          setInventory={setInventory}
          numPlots={numPlots}
          setNumPlots={() => {}}
          waterTanks={resources.waterTanks}
          setWaterTanks={() => {}}
          plots={plots}
          setPlots={() => {}}
          decorations={decorations}
          setDecorations={setDecorations}
          show={showShop}
          onClose={() => {}}
        />

        {/* Pronóstico */}
        <div className="rain-panel">
          <div className="rain-ico" data-level={forecast.label} />
          <div className="rain-label">Rain: {forecast.label} ({forecast.mm.toFixed(1)}mm)</div>
        </div>

        {/* Rio */}
        <div className="river" />

        <Player player={player} frameFarmer={frameFarmer} nearest={!!nearestId()} />

        {/* Tanques de agua */}
        <Tanks />
        
        <Plots plots={plots} nearestId={nearestId() || undefined} />

        <Decorations decorations={decorations} />
      </div>
    </>
  );
}

