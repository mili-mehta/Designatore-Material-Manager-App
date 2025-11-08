import React, { useState } from 'react';
import { Material, PurchaseIntent, User, Site, PurchaseIntentLineItem } from '../types';
import { UNITS } from '../constants';
// FIX: Standardized icon import path to use './icons.tsx' to resolve file casing conflicts.
import { PlusIcon, TrashIcon } from './icons.tsx';

interface NewPurchaseIntentFormProps {
  onAddIntent: (intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status'>) => void;
  onClose: () => void;
  currentUser: User;
  materials: Material[];
  sites: Site[];
}

const NewPurchaseIntentForm: React.FC<NewPurchaseIntentFormProps> = ({ onAddIntent, onClose, currentUser, materials, sites }) => {
  const [lineItems, setLineItems] = useState<Partial<PurchaseIntentLineItem>[]>([{}]);
  const [notes, setNotes] = useState('');

  const handleLineItemChange = (index: number, field: keyof PurchaseIntentLineItem, value: any) => {
    const updatedLineItems = [...lineItems];
    updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };
    
    if (field === 'materialId') {
        // FIX: Removed Number() conversion as material ID is a string.
        const material = materials.find(m => m.id === value);
        if (material) {
            updatedLineItems[index].unit = material.unit;
        }
    }
    
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
    
    const finalLineItems = lineItems.filter(item => item.materialId && item.quantity).map(item => ({
        ...item,
        id: `INTLI-${Date.now()}-${Math.random()}`,
    })) as PurchaseIntentLineItem[];

    if (finalLineItems.length === 0) {
        alert("Please add at least one valid material to the request.");
        return;
    }
    
    onAddIntent({
      lineItems: finalLineItems,
      notes,
      requestedBy: currentUser.name,
    });

    onClose();
  };
  
  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";
  const labelClasses = "block mb-1.5 text-sm font-medium text-gray-600";
  const smallInputClasses = `text-sm ${inputClasses}`;
  const smallLabelClasses = "block mb-1 text-xs font-medium text-gray-500";


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
       <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Requested Materials</h3>
        {lineItems.map((item, index) => (
          <div key={index} className="p-5 bg-gray-50 rounded-lg space-y-4 relative border border-gray-200">
             <button type="button" onClick={() => removeLineItem(index)} className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400" disabled={lineItems.length <= 1} title="Remove Item">
                <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className={smallLabelClasses}>Material</label>
                    <select value={item.materialId || ''} onChange={e => handleLineItemChange(index, 'materialId', e.target.value)} className={smallInputClasses} required>
                        <option value="">Select Material</option>
                         {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className={smallLabelClasses}>Site / Client</label>
                    <input 
                        type="text" 
                        value={item.site || ''} 
                        onChange={e => handleLineItemChange(index, 'site', e.target.value)} 
                        placeholder="e.g., Project Name" 
                        className={smallInputClasses}
                        list="sites-list"
                    />
                    <datalist id="sites-list">
                        {sites.map(site => <option key={site.id} value={site.name} />)}
                    </datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={smallLabelClasses}>Quantity</label>
                    <input type="number" value={item.quantity || ''} onChange={e => handleLineItemChange(index, 'quantity', e.target.value)} placeholder="0" min="1" className={smallInputClasses} required/>
                </div>
                 <div>
                    <label className={smallLabelClasses}>Unit</label>
                     <select value={item.unit || ''} onChange={e => handleLineItemChange(index, 'unit', e.target.value)} className={smallInputClasses}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
            
             <div>
                <label className={smallLabelClasses}>Item-specific Notes</label>
                <textarea value={item.notes || ''} onChange={e => handleLineItemChange(index, 'notes', e.target.value)} className={`${smallInputClasses} min-h-[50px]`} placeholder="Any notes for this specific material..."></textarea>
            </div>
          </div>
        ))}
      </div>
        
      <button type="button" onClick={addLineItem} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition border border-gray-300">
        <PlusIcon className="w-5 h-5" /> Add Another Material
      </button>

      <div>
        <label className={labelClasses}>Overall Notes / Reason for Request</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={`${inputClasses} min-h-[100px]`}
          placeholder="e.g., Required for upcoming Prestige project, kitchen cabinets..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">
          Cancel
        </button>
        <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">
          Submit Intent
        </button>
      </div>
    </form>
  );
};

export default NewPurchaseIntentForm;