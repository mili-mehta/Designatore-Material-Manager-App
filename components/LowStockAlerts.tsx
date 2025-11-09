import React from 'react';
import { InventoryItem } from '../types';
// FIX: Updated icon import path to './icons' to resolve a filename casing conflict.
import { PlusIcon, CheckCircleIcon } from './icons';

interface LowStockAlertsProps {
  lowStockItems: InventoryItem[];
  onCreateOrder: (materialId: string) => void;
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ lowStockItems, onCreateOrder }) => {
  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
        <div className="mx-auto w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
            <CheckCircleIcon className="w-7 h-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">All Good!</h3>
        <p className="mt-2 text-sm text-gray-500">
          There are currently no materials below their stock threshold that require a new purchase order.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Below Stock Threshold</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lowStockItems.map(item => (
            <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                  <p className="font-semibold text-amber-900">{item.name}</p>
                  <p className="text-sm text-amber-700">
                      In Stock: <span className="font-bold">{item.quantity}</span> {item.unit} 
                      <span className="text-amber-600"> (Threshold: {item.threshold})</span>
                  </p>
              </div>
              <button 
                onClick={() => onCreateOrder(item.id)} 
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-gray-800 font-medium transition text-xs shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Create Purchase Order
              </button>
            </div>
          ))}
        </div>
    </div>
  );
};

export default LowStockAlerts;