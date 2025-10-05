import React from "react";
import { useGame } from "../game/state/store";

export default function Grid(){
  const plots = useGame(s => s.plots);
  const nearestId = useGame(s => s.nearestId());

  return (
    <div className="plots">
      {plots.map(p => (
        <div key={p.id}
             className={`plot ${nearestId===p.id ? "focus":""} ${!p.alive ? "dead":""}`}
             style={{ left: p.x, top: p.y }}
             title={`Etapa ${p.stage} • humedad ${(p.moisture*100|0)}%`}>
          {/* fallback visual si no usas sprites por etapa */}
          <div className={`sprout s${p.stage}`} />
        </div>
      ))}
    </div>
  );
}
