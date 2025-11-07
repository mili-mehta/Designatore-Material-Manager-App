import React, { useState, useMemo, useEffect } from 'react';
import { Material, Site, InventoryItem, User } from '../types';
import { UNITS } from '../constants';

interface IssueMaterialFormProps {
  onIssue: (materialId: string, quantity: number, unit: string, issuedToSite: string, notes?: string) => void;
  onClose: () => void;
  currentUser: User;
  inventory: InventoryItem[];
  materials: Material[];
  sites: Site[];
}

const IssueMaterialForm: React.FC<IssueMaterialFormProps> = ({ onIssue, onClose, currentUser, inventory, materials, sites }) => {
  const [materialId, setMaterialId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [site, setSite] = useState<string>('');
  const [notes, setNotes] = useState('');

  const selectedInventoryItem = useMemo(() => {
    return inventory.find(item => item.id === materialId);
  }, [materialId, inventory]);
  
  useEffect(() => {
    if (selectedInventoryItem) {
        setUnit(selectedInventoryItem.unit);
    } else {
        setUnit('');
    }
  }, [selectedInventoryItem]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !quantity || !site || !unit) {
        alert("Please fill all required fields.");
        return;
    }
    const qty = parseFloat(quantity);
    if (!selectedInventoryItem || qty > selectedInventoryItem.quantity) {
        alert("Insufficient stock. Cannot issue more than available.");
        return;
    }
    if (qty <= 0) {
        alert("Quantity must be positive.");
        return;
    }

    onIssue(materialId, qty, unit, site, notes);
  };

  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";
  const labelClasses = "block mb-1.5 text-sm font-medium text-gray-600";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
            <label className={labelClasses}>Material</label>
            <select value={materialId} onChange={e => setMaterialId(e.target.value)} className={inputClasses} required>
                <option value="">Select Material</option>
                {inventory.map(item => {
                    const material = materials.find(m => m.id === item.id);
                    return material ? (
                        <option key={item.id} value={item.id}>
                            {material.name} ({item.quantity} {item.unit} in stock)
                        </option>
                    ) : null;
                })}
            </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClasses}>Quantity to Issue</label>
          <input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)} 
            placeholder="0" 
            min="0"
            max={selectedInventoryItem?.quantity || 0}
            step="any"
            className={inputClasses} 
            required
          />
           {selectedInventoryItem && parseFloat(quantity) > selectedInventoryItem.quantity && 
                <p className="text-red-500 text-xs mt-1">Cannot issue more than {selectedInventoryItem.quantity} {selectedInventoryItem.unit} in stock.</p>
           }
        </div>
         <div className="md:col-span-1">
            <label className={labelClasses}>Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className={inputClasses} required>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
      </div>

       <div>
          <label className={labelClasses}>Issued To (Site/Client)</label>
          <select value={site} onChange={e => setSite(e.target.value)} className={inputClasses} required>
            <option value="">Select Site/Client</option>
            {sites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

      <div>
          <label className={labelClasses}>Notes / Remarks</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClasses} min-h-[80px]`} placeholder="e.g., For Prestige project, Block A kitchen work..."></textarea>
      </div>
      
       <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm">
            <p className="text-gray-500">Issued By</p>
            <p className="font-medium text-gray-800">{currentUser.name}</p>
        </div>
        <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">Close</button>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">Issue Material</button>
        </div>
      </div>
    </form>
  );
};
export default IssueMaterialForm;