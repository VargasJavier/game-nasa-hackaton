import React from 'react'
import { useGame } from '../game/state/store';

export const Tanks = () => {

  const { resources } = useGame();

  return (
      <div className="tank-container">
        {resources.waterTanks.map((level, i) => (
          <div key={i} className="tank">
            {level > 0 && (
              <div className="water" style={{ height: `${(level / 10) * 100}%` }} />
            )}
            <div className="tank-label">{level}/10</div>
          </div>
        ))}
      </div>
  )
}

export default Tanks