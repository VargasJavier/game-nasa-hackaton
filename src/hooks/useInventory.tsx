import { useGame } from '../game/state/store';
import type { Inventory, InventoryItem } from '../game/core/types';

export const useInventory = () => {
  const {
    inventory,
    selectedSeedId,
    selectSeed,
    cycleSeed,
    setInventory
  } = useGame();

  const seeds: InventoryItem[] = inventory.filter(item => item.type === 'seed');
  const crops: InventoryItem[] = inventory.filter(item => item.type === 'crop');

  const availableSeeds = seeds.filter(seed => seed.quantity > 0);

  const currentSeed = availableSeeds.find(seed => seed.id === selectedSeedId) || availableSeeds[0];

  const addItem = (item: InventoryItem) => {
    const existingItem = inventory.find(i => i.id === item.id && i.type === item.type);
    if (existingItem) {
      existingItem.quantity += item.quantity;
      setInventory([...inventory]);
    } else {
      setInventory([...inventory, item]);
    }
  };

  const removeItem = (id: string, type: 'seed' | 'crop', quantity: number = 1) => {
    const updatedInventory = inventory.map(item =>
      item.id === id && item.type === type
        ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
        : item
    ).filter(item => item.quantity > 0);

    setInventory(updatedInventory);
  };

  return {
    inventory,
    seeds,
    crops,
    availableSeeds,
    selectedSeedId,
    currentSeed,
    selectSeed,
    cycleSeed,
    addItem,
    removeItem,
    setInventory
  };
};