import React from 'react';
import { Currency } from '../types';

interface CurrencyPickerProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
  { code: 'THB', symbol: '฿', label: 'Thai Baht (฿)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
];

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
}

export function CurrencyPicker({ selectedCurrency, onCurrencyChange }: CurrencyPickerProps) {
  return (
    <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full">
      <select
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="bg-transparent border-none text-sm font-medium focus:ring-0 focus:outline-none cursor-pointer text-primary"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.label}
          </option>
        ))}
      </select>
    </div>
  );
}