import React from 'react';
import ASSETS from '../assets/gameAssets';

export const Decorations: React.FC<DecorationsProps> = ({ decorations }) => {
  return (
    <div className="decorative">
      {decorations.map((dec, i) => (
        <div key={dec || i} className="tree">
          <img src={ASSETS.tree} alt={`Decoration ${i}`} width={70} />
        </div>
      ))}
    </div>
  );
};