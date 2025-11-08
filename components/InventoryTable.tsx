import React from 'react';
import { InventoryItem } from '../types';
// FIX: Updated icon import path from './icons' to './Icons' to resolve filename casing conflict.
import { AlertTriangleIcon } from './Icons';

interface InventoryTableProps {
  inventory: InventoryItem[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory }) => {

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900">Inventory Status</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Material</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">In Stock</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Threshold</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const isBelowThreshold = item.quantity <= item.threshold;
              return (
                <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-800">{item.name}</td>
                  <td className={`p-4 text-right font-medium tabular-nums ${isBelowThreshold ? 'text-red-600' : 'text-gray-800'}`}>{item.quantity}</td>
                  <td className="p-4 text-right font-medium tabular-nums text-gray-500">{item.threshold}</td>
                  <td className="p-4 text-sm text-gray-500">{item.unit}</td>
                  <td className="p-4 text-center">
                    {isBelowThreshold ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                        <AlertTriangleIcon className="w-3.5 h-3.5" /> Below Threshold
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Healthy
                      </span>
                    )}
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