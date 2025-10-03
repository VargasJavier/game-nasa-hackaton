export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'crop';
  quantity: number;
  price: number;
  icon: string;
}

export type Inventory = Item[];

export type Currency = number;