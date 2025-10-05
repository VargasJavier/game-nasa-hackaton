export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'plot' | 'tank' | 'decorative';
  price: number;
  icon: {
    type: 'url' | 'emoji',
    href: string
  }
}export interface ItemInventory extends Item{
  quantity: number;
}

export type Currency = number;

export type Stage = 0|1|2|3|4|5;

export type SeedIcon =
  | { type: "emoji"; href: string }
  | { type: "img"; href: string };

export type InventoryItem =
  { id: string; name: string; type: string; quantity: number; price: number; icon: SeedIcon }

export type Inventory = InventoryItem[];

export type SeedRef = {
  id: string;
  name: string;
  icon: SeedIcon;
};

export type Plot = {
  id: string;
  x: number; y: number;
  stage: Stage;
  moisture: number;   // 0..1
  alive: boolean;
  isIrrigated: boolean;
  seed: SeedRef | null;  // en tu código original podía ser null
};

export type Forecast = {
  mm: number;
  label: "seca" | "ligera" | "moderada" | "fuerte"
};

export type Player = { x: number; y: number; w: number; h: number };

export type Resources = {
  waterTanks: number[];  // cada tanque 0..10
  currency: number;
  turn: number;
};
