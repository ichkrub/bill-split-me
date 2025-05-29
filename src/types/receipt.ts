export interface ReceiptData {
  items: Array<{ name: string; price: number; quantity?: number }>;
  billInfo: {
    restaurantName: string;
    date: string | null;
    currency: string;
  };
  charges: Array<{ id: string; name: string; amount: number }>;
}
