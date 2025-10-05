// Global ambient declarations for the game project
// Put global types, interfaces or module augmentations here.

import type { Player as PlayerType } from '../game/core/types';
import type { Plot, Inventory } from '../game/core/types';

declare global {
  interface Window {
    __F4F_GAME__?: {
      debug?: boolean;
      version?: string;
    };
  }

  interface PlayerProps {
    player: PlayerType & { facing: string };
    frameFarmer: string;
    nearest?: boolean;
    finalTutorialCompleted: boolean
  }

  interface PlotsProps {
    plots: Plot[];
    nearestId?: string;
  }

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

  interface TurnCounterProps {
    currentTurn: number;
    onNextTurn: () => void;
  }

  interface Forecast {
    mm: number;
    label: 'seca' | 'ligera' | 'moderada' | 'fuerte';
    temperature: number;
    humidity: number;
  }
  
  interface ClimatePanelProps {
    currentTurn: number;
    currentForecast?: { mm: number; label: string } | null;
    onExpand?: () => void;
    isWeatherTutorialActive?: boolean;
    selectedDistrict?: string;
  }

  interface DecorationsProps {
    decorations: string[];
  }

  interface HUDPanelProps {
    showControls: boolean;
    setShowControls: (show: boolean) => void;
  }
  
  interface InventoryProps {
    inventory: Inventory;
    onClose?: () => void;
  }
}

// Ensure this file is treated as a module
export {};
