import React from 'react';
import type { Inventory } from '../game/core/types';
import { useGame } from '../game/state/store';

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
  decorations: string[];
  setDecorations: (d: string[]) => void;
  show: boolean;
  onClose: () => void;
  onSeedBought?: () => void;
  seedTutorialCompleted: boolean;
}

export default function Shop({ currency, setCurrency, inventory, setInventory, numPlots, setNumPlots, waterTanks, setWaterTanks, plots, setPlots, decorations, setDecorations, show, onClose, onSeedBought, seedTutorialCompleted }: ShopProps) {
  const selectedDistrict = useGame(state => state.selectedDistrict);

  const districtModifiers: Record<string, Record<string, number>> = {
    'Trujillo': { 'seed1': 2, 'seed2': -1, 'seed3': 1 },
    'Ascope': { 'seed1': 1, 'seed2': 2, 'seed3': -1 },
    'Pacasmayo': { 'seed1': -1, 'seed2': 1, 'seed3': 2 },
    'Chepen': { 'seed1': 2, 'seed2': -1, 'seed3': 1 },
    'Virú': { 'seed1': 1, 'seed2': 2, 'seed3': -1 },
    'Sánchez Carrión': { 'seed1': -1, 'seed2': 1, 'seed3': 2 },
    'Gran Chimú': { 'seed1': 2, 'seed2': -1, 'seed3': 1 },
    'Otuzco': { 'seed1': 1, 'seed2': 2, 'seed3': -1 },
    'Julcán': { 'seed1': -1, 'seed2': 1, 'seed3': 2 },
    'Santiago de Chuco': { 'seed1': 2, 'seed2': -1, 'seed3': 1 },
    'Bolívar': { 'seed1': 1, 'seed2': 2, 'seed3': -1 },
    'Pataz': { 'seed1': -1, 'seed2': 1, 'seed3': 2 },
  };

  const getModifierText = (itemId: string) => {
    if (!selectedDistrict || !districtModifiers[selectedDistrict]) return '';
    const mod = districtModifiers[selectedDistrict][itemId];
    if (mod === undefined) return '';
    return ` (${mod > 0 ? '+' : ''}${mod})`;
  };

  const availableItems = [
    { id: 'seed1', name: 'Corn Seed', type: 'seed' as const, price: 10, icon: '🌽' },
    { id: 'seed2', name: 'Wheat Seed', type: 'seed' as const, price: 15, icon: '🌾' },
    { id: 'seed3', name: 'Carrot Seed', type: 'seed' as const, price: 12, icon: '🥕' },
    { id: 'plot', name: 'Plot', type: 'plot' as const, price: 50, icon: '🌱' },
    { id: 'tank', name: 'Water Tank', type: 'tank' as const, price: 30, icon: '🪣' },
    { id: 'tree', name: 'Jungle Tree', type: 'decorative' as const, price: 25, icon: '🌳' },
    { id: 'bush', name: 'Bush', type: 'decorative' as const, price: 20, icon: '🌿' },
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
          const origin = { x: 350, y: 250 };
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
      } else if (item.type === 'decorative') {
        if (!decorations.includes(item.id)) {
          setDecorations([...decorations, item.id]);
        }
      } else {
        const existing = inventory.find(i => i.id === item.id && i.type === item.type);
        if (existing) {
          existing.quantity += 1;
          setInventory([...inventory]);
        } else {
          setInventory([...inventory, { ...item, quantity: 1 }]);
        }
        if (item.type === 'seed') {
          onSeedBought?.();
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
    <div className={show ? "shop show" : "shop"}>
      <div className='shop-header'>
        <h3>Shop</h3>
        <div>🪙: {currency}</div>
        <button onClick={onClose}>Close</button>
      </div>
      <div className='shop-body'>
        <div className='shop-buy'>
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
            } else if (item.type === 'decorative') {
              disabled = disabled || decorations.includes(item.id);
              maxText = decorations.includes(item.id) ? ' (Owned)' : '';
            }
            return (
              <div className='shop-item' key={item.id}>
                {item.icon} {item.name}{getModifierText(item.id)}{maxText} - {item.price} <button onClick={() => buyItem(item)} disabled={disabled}>Buy</button>
              </div>
            );
          })}
        </div>
        <div className='shop-sell'>
          <h4>Sell</h4>
          {inventory.filter(i => i.type === 'crop').map(item => (
            <div className='shop-item' key={item.id}>
              {item.icon} {item.name}: {item.quantity} - {item.price} each <button onClick={() => sellItem(item.id)}>Sell</button>
            </div>
          ))}
        </div>
        {!seedTutorialCompleted && <div className="seed-tutorial">Buy the first seed.</div>}
      </div>
    </div>
  );
}