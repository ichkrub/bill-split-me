export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  diners: string[];
}

export interface Diner {
  id: string;
  name: string;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
}

export interface ChargeBreakdown {
  name: string;
  amount: number;
}

export interface DinerSummary {
  dinerId: string;
  name: string;
  items: Item[];
  subtotal: number;
  charges: ChargeBreakdown[];
  total: number;
}

export interface BillInfo {
  restaurantName: string;
  date: Date | null;
  currency: string;
}

export type SplitMode = 'manual' | 'shared' | null;

export interface BillProgress {
  totalItems: number;
  claimedItems: number;
  participantsWithClaims: number;
  totalParticipants: number;
  status: 'waiting' | 'in_progress' | 'ready' | 'completed';
}

export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  diners: string[];
}