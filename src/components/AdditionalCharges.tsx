import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdditionalCharge } from '../types';

interface AdditionalChargesProps {
  charges: AdditionalCharge[];
  currencySymbol: string;
  onUpdateCharge: (id: string, amount: number, name?: string) => void;
}

export function AdditionalCharges({ charges, currencySymbol, onUpdateCharge }: AdditionalChargesProps) {
  const [newChargeName, setNewChargeName] = React.useState('');
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({});

  // Reset input values when charges change
  React.useEffect(() => {
    const newInputValues: Record<string, string> = {};
    charges.forEach(charge => {
      if (charge.amount !== 0) {
        newInputValues[charge.id] = Math.abs(charge.amount).toString();
      }
    });
    setInputValues(newInputValues);
  }, [charges]);

  const handleChange = (id: string, value: string) => {
    // Store the raw input value
    setInputValues(prev => ({ ...prev, [id]: value }));
    
    // Allow empty input
    if (value === '') {
      onUpdateCharge(id, 0, id === 'discount' ? 'Discount' : undefined);
      return;
    }
    
    // Parse the numeric value
    const amount = parseFloat(value);
    if (!isNaN(amount)) {
      onUpdateCharge(id, id === 'discount' ? -Math.abs(amount) : amount, id === 'discount' ? 'Discount' : undefined);
    }
  };

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChargeName.trim()) {
      const newCharge: AdditionalCharge = {
        id: crypto.randomUUID(),
        name: newChargeName.trim(),
        amount: 0,
      };
      onUpdateCharge(newCharge.id, 0, newChargeName.trim());
      setNewChargeName('');
      setShowAddForm(false);
    }
  };

  const handleRemoveCharge = (id: string) => {
    if (id === 'discount') {
      onUpdateCharge(id, 0, 'Discount');
    } else {
      onUpdateCharge(id, -1);
    }
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  // Sort charges to ensure discount appears last
  const sortedCharges = React.useMemo(() => {
    const nonDiscountCharges = charges.filter(charge => charge.id !== 'discount');
    const discountCharge = charges.find(c => c.id === 'discount') || { id: 'discount', name: 'Discount', amount: 0 };
    // Ensure discount amount is always negative
    if (discountCharge.amount > 0) {
      discountCharge.amount = -discountCharge.amount;
    }
    return [...nonDiscountCharges, discountCharge];
  }, [charges]);

  return (
    <div className="card p-4 sm:p-8 space-y-4">
      <h2 className="text-lg font-semibold">Additional Charges</h2>
      <div className="space-y-4">
        {sortedCharges.map((charge) => (
          <div key={charge.id} className="flex items-center gap-4">
            <label className={`flex-1 font-medium text-sm sm:text-base ${charge.id === 'discount' ? 'text-primary' : 'text-gray-700'}`}>
              {charge.name}
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${charge.id === 'discount' ? 'text-primary' : 'text-gray-500'}`}>
                {charge.id === 'discount' ? `-${currencySymbol}` : currencySymbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={inputValues[charge.id] || ''}
                onChange={(e) => handleChange(charge.id, e.target.value)}
                onBlur={() => {
                  const amount = Math.abs(charge.amount);
                  setInputValues(prev => ({
                    ...prev,
                    [charge.id]: amount > 0 ? amount.toFixed(2) : ''
                  }));
                }}
                placeholder="0.00"
                className={`input pl-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  charge.id === 'discount' ? 'text-green-600' : ''
                }`}
              />
            </div>
            {charge.id !== 'tax' && charge.id !== 'service' && charge.id !== 'discount' && (
              <button
                onClick={() => handleRemoveCharge(charge.id)}
                className="text-gray-400 hover:text-red-500"
                title="Remove charge"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {showAddForm ? (
          <form onSubmit={handleAddCharge} className="flex gap-2">
            <input
              type="text"
              value={newChargeName}
              onChange={(e) => setNewChargeName(e.target.value)}
              placeholder="Enter charge name"
              className="input flex-1"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn w-full flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5"
          >
            <Plus size={18} />
            <span className="font-semibold">Add Other Charge</span>
          </button>
        )}
      </div>
    </div>
  );
}