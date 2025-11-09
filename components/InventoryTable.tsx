import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { MagnifyingGlassIcon, PencilIcon, CheckCircleIcon, XMarkIcon } from './icons';
import { UNITS } from '../constants';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onUpdateItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<{ threshold: number; unit: string } | null>(null);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditedData({ threshold: item.threshold, unit: item.unit });
  };

  const handleCancel = () => {
    setEditingItemId(null);
    setEditedData(null);
  };

  const handleSave = () => {
    if (editingItemId && editedData) {
      onUpdateItem(editingItemId, {
        threshold: Number(editedData.threshold),
        unit: editedData.unit
      });
    }
    setEditingItemId(null);
    setEditedData(null);
  };

  const handleDataChange = (field: 'threshold' | 'unit', value: string | number) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center p-6">
            <h2 className="text-xl font-semibold text-gray-900">Inventory Status</h2>
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-100 border-transparent rounded-full py-2 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition"
              />
            </div>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Material</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantity in Stock</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Threshold</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => {
              const isLowStock = item.quantity <= item.threshold;
              const isEditing = editingItemId === item.id;

              return (
                <tr key={item.id} className={`border-b border-gray-200 last:border-b-0 transition-colors ${isEditing ? 'bg-primary-50' : 'hover:bg-gray-50/50'}`}>
                  <td className="p-4 font-medium text-gray-800">{item.name}</td>
                  <td className={`p-4 text-right font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>{item.quantity}</td>
                  <td className="p-4 text-right text-gray-600">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editedData?.threshold ?? ''}
                        onChange={(e) => handleDataChange('threshold', e.target.value)}
                        className="w-24 bg-white border-gray-300 rounded-md p-1.5 text-gray-800 text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm text-sm"
                      />
                    ) : (
                      item.threshold
                    )}
                  </td>
                  <td className="p-4 text-gray-600">
                     {isEditing ? (
                      <select 
                        value={editedData?.unit ?? ''}
                        onChange={(e) => handleDataChange('unit', e.target.value)}
                        className="w-28 bg-white border-gray-300 rounded-md p-1.5 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm text-sm"
                      >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      item.unit
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isLowStock ? 'Below Threshold' : 'Healthy'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {isEditing ? (
                        <>
                           <button onClick={handleSave} className="text-green-500 hover:text-green-700 transition" title="Save">
                                <CheckCircleIcon className="w-6 h-6" />
                           </button>
                           <button onClick={handleCancel} className="text-red-500 hover:text-red-700 transition" title="Cancel">
                                <XMarkIcon className="w-6 h-6" />
                           </button>
                        </>
                      ) : (
                           <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-primary-600 transition" title="Edit">
                                <PencilIcon className="w-5 h-5" />
                           </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;