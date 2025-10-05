import React from "react";
import { useGame } from "../game/state/store";
export default function ClimatePanel(){
  const fc = useGame(s => s.forecast);
  return (
    <div className="rain-panel">
      <div className="rain-ico" data-level={fc.label} />
      <div className="rain-label">Rain: {fc.label} ({fc.mm.toFixed(1)}mm)</div>
    </div>
  );
}
