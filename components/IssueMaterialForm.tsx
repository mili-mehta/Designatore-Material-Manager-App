import React, { useState, useMemo } from 'react';
import { InventoryItem, Site, User } from '../types';
import { UNITS } from '../constants';
// FIX: Standardized icon import to use './icons' to resolve filename casing conflict.
import { PlusIcon, TrashIcon } from './icons';

interface IssueMaterialFormProps {
  onIssue: (items: {
    materialId: string;
    quantity: number;
    unit: string;
    issuedToSite: string;
    notes?: string;
  }[]) => void;
  onClose: () => void;
  currentUser: User;
  inventory: InventoryItem[];
  sites: Site[];
}

type FormIssuanceLineItem = {
  materialId?: string;
  _materialNameInput?: string;
  quantity?: string;
  unit?: string;
  site?: string;
  notes?: string;
  _currentStock?: number;
};

const IssueMaterialForm: React.FC<IssueMaterialFormProps> = ({ onIssue, onClose, currentUser, inventory, sites }) => {
  const [lineItems, setLineItems] = useState<FormIssuanceLineItem[]>([{}]);
  
  const sortedInventory = useMemo(() => [...inventory].sort((a, b) => a.name.localeCompare(b.name)), [inventory]);
  const sortedSites = useMemo(() => [...sites].sort((a, b) => a.name.localeCompare(b.name)), [sites]);

  const handleLineItemChange = (index: number, field: keyof FormIssuanceLineItem, value: any) => {
    const updatedLineItems = [...lineItems];
    const currentItem = { ...updatedLineItems[index] };

    (currentItem as any)[field] = value;

    if (field === '_materialNameInput') {
        const materialInInventory = inventory.find(i => i.name === value);
        if (materialInInventory) {
            currentItem.materialId = materialInInventory.id;
            currentItem.unit = materialInInventory.unit;
            currentItem._currentStock = materialInInventory.quantity;
        } else {
            currentItem.materialId = undefined;
            currentItem.unit = undefined;
            currentItem._currentStock = undefined;
        }
    }

    updatedLineItems[index] = currentItem;
    setLineItems(updatedLineItems);
  };

  const addLineItem = () => setLineItems([...lineItems, {}]);
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalItems = lineItems
        .map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
        }))
        .filter(item => item.materialId && item.quantity > 0 && item.site && item.unit);

    if (finalItems.length === 0) {
        alert("Please add at least one valid material issuance.");
        return;
    }
    
    for (const item of finalItems) {
        const stockItem = inventory.find(i => i.id === item.materialId);
        if (!stockItem || item.quantity > stockItem.quantity) {
            alert(`Insufficient stock for ${item._materialNameInput}. Cannot issue more than ${stockItem?.quantity || 0} available.`);
            return;
        }
    }
    
    onIssue(finalItems.map(item => ({
        materialId: item.materialId!,
        quantity: item.quantity,
        unit: item.unit!,
        issuedToSite: item.site!,
        notes: item.notes
    })));
  };

  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";
  const smallInputClasses = `text-sm ${inputClasses}`;
  const smallLabelClasses = "block mb-1 text-xs font-medium text-gray-500";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
        {lineItems.map((item, index) => (
          <div key={index} className="p-5 bg-gray-50 rounded-lg space-y-4 relative border border-gray-200">
            <button type="button" onClick={() => removeLineItem(index)} className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400" disabled={lineItems.length <= 1} title="Remove Item">
              <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={smallLabelClasses}>Material</label>
                    <input
                      type="text"
                      list="materials-issue-list"
                      value={item._materialNameInput || ''}
                      onChange={e => handleLineItemChange(index, '_materialNameInput', e.target.value)}
                      placeholder="Search and select material..."
                      className={smallInputClasses}
                      required
                    />
                    <datalist id="materials-issue-list">
                        {sortedInventory.map(invItem => (
                            <option key={invItem.id} value={invItem.name}>
                                {`(${invItem.quantity} ${invItem.unit} in stock)`}
                            </option>
                        ))}
                    </datalist>
                    {item._currentStock !== undefined && <p className="text-xs text-gray-500 mt-1">In Stock: {item._currentStock} {item.unit}</p>}
                </div>
                <div>
                  <label className={smallLabelClasses}>Issued To (Site/Client)</label>
                  <select value={item.site || ''} onChange={e => handleLineItemChange(index, 'site', e.target.value)} className={smallInputClasses} required>
                    <option value="">Select Site/Client</option>
                    {sortedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={smallLabelClasses}>Quantity to Issue</label>
                <input 
                  type="number" 
                  value={item.quantity || ''} 
                  onChange={e => handleLineItemChange(index, 'quantity', e.target.value)} 
                  placeholder="0" 
                  min="0"
                  max={item._currentStock}
                  step="any"
                  className={smallInputClasses} 
                  required
                />
                {item._currentStock !== undefined && Number(item.quantity) > item._currentStock && 
                    <p className="text-red-500 text-xs mt-1">Cannot issue more than {item._currentStock} {item.unit} in stock.</p>
                }
              </div>
              <div>
                  <label className={smallLabelClasses}>Unit</label>
                  <select value={item.unit || ''} onChange={e => handleLineItemChange(index, 'unit', e.target.value)} className={smallInputClasses} required>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
              </div>
            </div>

            <div>
                <label className={smallLabelClasses}>Notes / Remarks</label>
                <textarea value={item.notes || ''} onChange={e => handleLineItemChange(index, 'notes', e.target.value)} className={`${smallInputClasses} min-h-[50px]`} placeholder="e.g., For project, Block A kitchen work..."></textarea>
            </div>
          </div>
        ))}
      </div>
        
      <button type="button" onClick={addLineItem} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition border border-gray-300">
        <PlusIcon className="w-5 h-5" /> Add Another Material
      </button>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm">
            <p className="text-gray-500">Issued By</p>
            <p className="font-medium text-gray-800">{currentUser.name}</p>
        </div>
        <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">Close</button>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">Issue Materials</button>
        </div>
      </div>
    </form>
  );
};
export default IssueMaterialForm;