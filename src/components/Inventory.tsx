import React from 'react';
import type { Inventory, InventoryItem } from '../game/core/types';

export default function Inventory({ inventory, onClose }: InventoryProps) {
  return (
    <div className="inventory">
      <h3>Inventory</h3>
      {onClose && <button onClick={onClose}>Close</button>}
      {inventory.length === 0 ? (
        <p>Empty</p>
      ) : (
        <ul>
          {inventory.map((item: InventoryItem) => (
            <li key={item.id}>
              {item.icon.href} {item.name}: {item.quantity} (Price: {item.price})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}