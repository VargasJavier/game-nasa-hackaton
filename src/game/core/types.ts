export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'plot' | 'tank' | 'decorative';
  quantity: number;
  price: number;
  icon: string;
}

export type Inventory = Item[];

export type Currency = number;