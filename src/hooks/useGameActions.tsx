import { useGame } from '../game/state/store';

export const useGameActions = () => {
  const {
    plant,
    harvest,
    irrigate,
    nextTurn,
    selectSeed,
    cycleSeed,
    setNumPlots,
    addTank,
    setInventory,
    setCurrency,
    setDecorations,
    toggleShop,
    toggleControls
  } = useGame();

  return {
    plant,
    harvest,
    irrigate,
    nextTurn,
    selectSeed,
    cycleSeed,
    setNumPlots,
    addTank,
    setInventory,
    setCurrency,
    setDecorations,
    toggleShop,
    toggleControls
  };
};