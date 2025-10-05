// Global ambient declarations for the game project
// Put global types, interfaces or module augmentations here.

declare global {
  interface Window {
    __F4F_GAME__?: {
      debug?: boolean;
      version?: string;
    };
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
  }
}

// Ensure this file is treated as a module
export {};
