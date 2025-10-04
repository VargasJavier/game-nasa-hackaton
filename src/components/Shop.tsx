import React from 'react';
import type { Inventory } from '../game/core/types';

interface ShopProps {
  currency: number;
  setCurrency: (c: number) => void;
  inventory: Inventory;
  setInventory: (inv: Inventory) => void;
  numPlots: number;
  setNumPlots: (n: number) => void;
  waterTanks: number[];
  setWaterTanks: (t: number[]) => void;
  plots: any[]; // Plot[]
  setPlots: (p: any[]) => void;
  onClose: () => void;
}

export default function Shop({ currency, setCurrency, inventory, setInventory, numPlots, setNumPlots, waterTanks, setWaterTanks, plots, setPlots, onClose }: ShopProps) {
  const availableItems = [
    { id: 'seed1', name: 'Corn Seed', type: 'seed' as const, price: 10, icon: '🌽' },
    { id: 'seed2', name: 'Wheat Seed', type: 'seed' as const, price: 15, icon: '🌾' },
    { id: 'seed3', name: 'Carrot Seed', type: 'seed' as const, price: 12, icon: '🥕' },
    { id: 'plot', name: 'Plot', type: 'plot' as const, price: 50, icon: '🌱' },
    { id: 'tank', name: 'Water Tank', type: 'tank' as const, price: 30, icon: '🪣' },
  ];

  const buyItem = (item: typeof availableItems[0]) => {
    if (currency >= item.price) {
      setCurrency(currency - item.price);
      if (item.type === 'plot') {
        if (numPlots < 9) {
          setNumPlots(numPlots + 1);
          // add new plot
          const cols = 3;
          const r = Math.floor(numPlots / cols);
          const c = numPlots % cols;
          const origin = { x: 520, y: 390 };
          const newPlot = {
            x: origin.x + c * 86,
            y: origin.y + r * 86,
            stage: 0,
            moisture: 0.25,
            alive: true,
          };
          setPlots([...plots, newPlot]);
        }
      } else if (item.type === 'tank') {
        if (waterTanks.length < 10) {
          setWaterTanks([...waterTanks, 0]);
        }
      } else {
        const existing = inventory.find(i => i.id === item.id && i.type === item.type);
        if (existing) {
          existing.quantity += 1;
          setInventory([...inventory]);
        } else {
          setInventory([...inventory, { ...item, quantity: 1 }]);
        }
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
        {availableItems.map(item => {
          let disabled = currency < item.price;
          let maxText = '';
          if (item.type === 'plot') {
            disabled = disabled || numPlots >= 9;
            maxText = ` (${numPlots}/9)`;
          } else if (item.type === 'tank') {
            disabled = disabled || waterTanks.length >= 10;
            maxText = ` (${waterTanks.length}/10)`;
          }
          return (
            <div key={item.id}>
              {item.icon} {item.name}{maxText} - {item.price} <button onClick={() => buyItem(item)} disabled={disabled}>Buy</button>
            </div>
          );
        })}
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