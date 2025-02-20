import React from 'react';
import { PlusCircle, Trash2, Edit2, Check, X, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { CurrencyPicker } from './CurrencyPicker';
import { Item, Diner } from '../types';

interface BillFormProps {
  items: Item[];
  diners: Diner[];
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  currencySymbol: string;
  onAddItem: (item: Omit<Item, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, item: Partial<Item>) => void;
  onAddDiner: (name: string) => void;
  onRemoveDiner: (id: string) => void;
}

interface EditingItem {
  name: string;
  price: number;
  quantity: number;
}

export function BillForm({
  items,
  diners,
  onAddItem,
  selectedCurrency,
  onCurrencyChange,
  onRemoveItem,
  onUpdateItem,
  onAddDiner,
  onRemoveDiner,
  currencySymbol,
}: BillFormProps) {
  const [showItemForm, setShowItemForm] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState('');
  const [newItemPrice, setNewItemPrice] = React.useState('');
  const [newItemQuantity, setNewItemQuantity] = React.useState('1');
  const [newDinerName, setNewDinerName] = React.useState('');
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingValues, setEditingValues] = React.useState<EditingItem | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName && newItemPrice) {
      const quantity = parseInt(newItemQuantity) || 1;
      const price = parseFloat(newItemPrice);
      onAddItem({
        name: newItemName,
        price: price,
        quantity,
        diners: [],
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQuantity('1');
      setShowItemForm(false);
    }
  };

  const handleAddDiner = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDinerName) {
      onAddDiner(newDinerName);
      setNewDinerName('');
    }
  };

  const startEditing = (item: Item) => {
    setEditingItemId(item.id);
    setEditingValues({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    });
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingValues(null);
  };

  const saveEditing = (id: string) => {
    if (editingValues) {
      onUpdateItem(id, editingValues);
      cancelEditing();
    }
  };

  const handleNumberChange = (value: string, setter: (value: string) => void) => {
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    setter(cleanValue);
  };

  const handleQuantityChange = (value: number) => {
    if (editingValues) {
      const newQuantity = Math.max(1, value);
      setEditingValues({ ...editingValues, quantity: newQuantity });
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-8">
        {/* Add Person Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Add Person</h2>
          <p className="text-gray-600 text-sm mb-4">
            Add people who will be splitting the bill
          </p>
          <form onSubmit={handleAddDiner} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDinerName}
              onChange={(e) => setNewDinerName(e.target.value)}
              placeholder="Person's name"
              className="input flex-1"
            />
            <button
              type="submit"
              className="btn btn-primary whitespace-nowrap"
            >
              Add Person
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {diners.map((diner) => (
              <div
                key={diner.id}
                className="bg-gray-100/50 px-4 py-2 rounded-full flex items-center gap-2"
              >
                <span className="text-sm">{diner.name}</span>
                <button
                  onClick={() => onRemoveDiner(diner.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">Items</h2>
            <CurrencyPicker
              selectedCurrency={selectedCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>
          <div className="text-sm text-gray-600 mb-6">
            <div className="text-sm text-gray-600">
              Check the boxes to assign items to each person
            </div>
          </div>
        
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border-2 rounded-2xl p-3 sm:p-6 border-gray-100">
                {editingItemId === item.id && editingValues ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingValues.name}
                      onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                      className="input w-full"
                      placeholder="Item name"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={editingValues.price || ''}
                            onChange={(e) => {
                              const cleanValue = e.target.value.replace(/^0+(?=\d)/, '');
                              setEditingValues({ 
                                ...editingValues, 
                                price: cleanValue === '' ? 0 : parseFloat(cleanValue)
                              });
                            }}
                            step="0.01"
                            min="0"
                            className="input pl-8"
                            placeholder="Enter price"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editingValues.quantity || ''}
                            onChange={(e) => {
                              const cleanValue = e.target.value.replace(/^0+(?=\d)/, '');
                              setEditingValues({ 
                                ...editingValues, 
                                quantity: cleanValue === '' ? 1 : parseInt(cleanValue)
                              });
                            }}
                            min="1"
                            className="input pr-12"
                            placeholder="Enter quantity"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(editingValues.quantity + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(editingValues.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {editingValues.quantity > 1 && (
                      <div className="text-sm text-gray-600">
                        Price per item: {currencySymbol}{(editingValues.price / editingValues.quantity).toFixed(2)}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => cancelEditing()}
                        className="btn btn-secondary inline-flex items-center gap-1"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={() => saveEditing(item.id)}
                        className="btn btn-primary inline-flex items-center gap-1"
                      >
                        <Check size={16} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {currencySymbol}{item.price.toFixed(2)} × {item.quantity}
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-600">
                              Price per item: {currencySymbol}{(item.price / item.quantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="text-gray-400 hover:text-primary"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {diners.map((diner) => (
                        <label
                          key={diner.id}
                          className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.diners.includes(diner.id)}
                            onChange={(e) => {
                              const newDiners = e.target.checked
                                ? [...item.diners, diner.id]
                                : item.diners.filter((d) => d !== diner.id);
                              onUpdateItem(item.id, { diners: newDiners });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          />
                          <span className="text-sm">{diner.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {!showItemForm ? (
            <button
              onClick={() => setShowItemForm(true)}
              className="btn w-full mt-4 flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <Plus size={20} />
              <span className="font-semibold">Add Item</span>
            </button>
          ) : (
            <form onSubmit={handleAddItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name"
                  className="input"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newItemPrice}
                      onChange={(e) => handleNumberChange(e.target.value, setNewItemPrice)}
                      placeholder="Enter price"
                      step="0.01"
                      min="0"
                      className="input pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={newItemQuantity}
                      onChange={(e) => handleNumberChange(e.target.value, setNewItemQuantity)}
                      placeholder="Enter quantity"
                      min="1"
                      className="input pr-12"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        onClick={() => setNewItemQuantity((parseInt(newItemQuantity) + 1).toString())}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemQuantity(Math.max(1, parseInt(newItemQuantity) - 1).toString())}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {parseInt(newItemQuantity) > 1 && newItemPrice && (
                <div className="text-sm text-gray-600">
                  Price per item: {currencySymbol}{(parseFloat(newItemPrice) / parseInt(newItemQuantity)).toFixed(2)}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(false);
                    setNewItemName('');
                    setNewItemPrice('');
                    setNewItemQuantity('1');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} />
                  <span>Add Item</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}