import React from 'react';
import type { Player as PlayerType } from '../game/core/types';

interface PlayerProps {
  player: PlayerType & { facing: string };
  frameFarmer: string;
  nearest?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ player, frameFarmer, nearest }) => {
  return (
    <div
      className={`player ${nearest ? "near" : ""}`}
      style={{ left: player.x, top: player.y }}
    >
      <img src={frameFarmer} alt="Personaje" width={player.w} />
    </div>
  );
};