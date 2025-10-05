import React from 'react';
import ASSETS from '../assets/gameAssets';

export const Plots: React.FC<PlotsProps> = ({ plots, nearestId }) => {
  return (
    <div className="plots">
      {plots.map((p) => (
        <div
          key={p.id}
          className={`plot ${(nearestId && p.id === nearestId) ? "focus" : ""} ${!p.alive ? "dead" : ""}`}
          style={{ left: p.x, top: p.y }}
        >
          {p.isIrrigated
            ? <img src={ASSETS.stageIrrigate} alt="" draggable={false} width={65} height={65} />
            : ASSETS.plotStages[p.stage]
              ? <img src={ASSETS.plotStages[p.stage]} alt="" draggable={false} width={65} height={65} />
              : <div className={`sprout s${p.stage}`} />}
        </div>
      ))}
    </div>
  );
};