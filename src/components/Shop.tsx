import React from 'react';
import type { Inventory } from '../game/core/types';

interface ShopProps {
  currency: number;
  setCurrency: (c: number) => void;
  inventory: Inventory;
  setInventory: (inv: Inventory) => void;
  onClose: () => void;
}

export default function Shop({ currency, setCurrency, inventory, setInventory, onClose }: ShopProps) {
  const availableItems = [
    { id: 'seed1', name: 'Corn Seed', type: 'seed' as const, price: 10, icon: '🌽' },
    { id: 'seed2', name: 'Wheat Seed', type: 'seed' as const, price: 15, icon: '🌾' },
    { id: 'seed3', name: 'Carrot Seed', type: 'seed' as const, price: 12, icon: '🥕' },
  ];

  const buyItem = (item: typeof availableItems[0]) => {
    if (currency >= item.price) {
      setCurrency(currency - item.price);
      const existing = inventory.find(i => i.id === item.id && i.type === item.type);
      if (existing) {
        existing.quantity += 1;
        setInventory([...inventory]);
      } else {
        setInventory([...inventory, { ...item, quantity: 1 }]);
      }
    }
  };

  const sellItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId && i.type === 'crop');
    if (item && item.quantity > 0) {
      setCurrency(currency + item.price);
      item.quantity -= 1;
      if (item.quantity === 0) {
        setInventory(inventory.filter(i => i !== item));
      } else {
        setInventory([...inventory]);
      }
    }
  };

  return (
    <div className="shop">
      <h3>Shop</h3>
      <div>Currency: {currency}</div>
      <button onClick={onClose}>Close</button>
      <div>
        <h4>Buy</h4>
        {availableItems.map(item => (
          <div key={item.id}>
            {item.icon} {item.name} - {item.price} <button onClick={() => buyItem(item)} disabled={currency < item.price}>Buy</button>
          </div>
        ))}
      </div>
      <div>
        <h4>Sell</h4>
        {inventory.filter(i => i.type === 'crop').map(item => (
          <div key={item.id}>
            {item.icon} {item.name}: {item.quantity} - {item.price} each <button onClick={() => sellItem(item.id)}>Sell</button>
          </div>
        ))}
      </div>
    </div>
  );
}