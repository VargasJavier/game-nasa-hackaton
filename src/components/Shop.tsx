import React from 'react';
import type { Inventory, Item } from '../game/core/types';

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
  const availableItems: Item[] = [
    {
      id: 'seed1',
      name: 'Corn Seed',
      type: 'seed',
      price: 10,
      icon: {
        type: 'emoji',
        href: '🌽'
      }
    },
    {
      id: 'seed2',
      name: 'Wheat Seed',
      type: 'seed',
      price: 15,
      icon: {
        type: 'emoji',
        href: '🌾'
      }
    },
    {
      id: 'seed3',
      name: 'Carrot Seed',
      type: 'seed',
      price: 12,
      icon: {
        type: 'emoji',
        href: '🥕'
      }
    },
    {
      id: 'plot',
      name: 'Plot',
      type: 'plot',
      price: 50,
      icon: {
        type: 'emoji',
        href: '🌱'
      }
    },
    {
      id: 'tank',
      name: 'Water Tank',
      type: 'tank',
      price: 30,
      icon: {
        type: 'emoji',
        href: '🪣'
      }
    },
    {
      id: 'tree',
      name: 'Jungle Tree',
      type: 'decorative',
      price: 25,
      icon: {
        type: 'emoji',
        href: '🌳'
      }
    },
    {
      id: 'bush',
      name: 'Bush',
      type: 'decorative',
      price: 20,
      icon: {
        type: 'emoji',
        href: '🌿'
      }
    },
  ];

  const buyItem = (item: Item) => {
    // limits: ensure purchase is possible before deducting currency
    if (item.type === 'plot' && numPlots >= 9) return;
    if (item.type === 'tank' && waterTanks.length >= 10) return;
    if (item.type === 'decorative' && decorations.includes(item.id)) return;
    if (currency < item.price) return;

    // deduct currency
    setCurrency(currency - item.price);

    if (item.type === 'plot') {
      const index = numPlots;
      const cols = 3;
      const r = Math.floor(index / cols);
      const c = index % cols;
      const origin = { x: 350, y: 250 };
      const newPlot = {
        x: origin.x + c * 86,
        y: origin.y + r * 86,
        stage: 0,
        moisture: 0.25,
        alive: true,
      };
      setNumPlots(numPlots + 1);
      setPlots([...plots, newPlot]);
      return;
    }

    if (item.type === 'tank') {
      setWaterTanks([...waterTanks, 0]);
      return;
    }

    if (item.type === 'decorative') {
      if (!decorations.includes(item.id)) {
        setDecorations([...decorations, item.id]);
      }
      return;
    }

    // seeds and other inventory items
    const existing = inventory.find(i => i.id === item.id && i.type === item.type);
    if (existing) {
      const newInv = inventory.map(i => (i.id === existing.id && i.type === existing.type ? { ...i, quantity: i.quantity + 1 } : i));
      setInventory(newInv as Inventory);
    } else {
      setInventory([
        ...inventory,
        {
          id: item.id,
          name: item.name,
          type: item.type as 'seed',
          quantity: 1,
          price: item.price,
          icon: item.icon,
        },
      ] as Inventory);
    }

    if (item.type === 'seed') {
      onSeedBought?.();
    }
  };

  const sellItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId && i.type === 'crop');
    if (!item || item.quantity <= 0) return;

    setCurrency(currency + item.price);

    if (item.quantity === 1) {
      setInventory(inventory.filter(i => !(i.id === itemId && i.type === 'crop')) as Inventory);
    } else {
      setInventory(inventory.map(i => (i.id === itemId && i.type === 'crop' ? { ...i, quantity: i.quantity - 1 } : i)) as Inventory);
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
                {item.icon.href} {item.name}{maxText} - {item.price} <button onClick={() => buyItem(item)} disabled={disabled}>Buy</button>
              </div>
            );
          })}
        </div>
        <div className='shop-sell'>
          <h4>Sell</h4>
          {inventory.filter(i => i.type === 'crop').map(item => (
            <div className='shop-item' key={item.id}>
              {item.icon.href} {item.name}: {item.quantity} - {item.price} each <button onClick={() => sellItem(item.id)}>Sell</button>
            </div>
          ))}
        </div>
        {!seedTutorialCompleted && <div className="seed-tutorial">Buy the first seed.</div>}
      </div>
    </div>
  );
}