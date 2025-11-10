import React from 'react';
import { PurchaseOrder, Material, Vendor } from '../types';
import Modal from './Modal';
// FIX: Standardized icon import to use './icons' to resolve filename casing conflict.
import { CheckCircleIcon } from './icons';

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: PurchaseOrder;
  materials: Material[];
  vendors: Vendor[];
}

const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({ isOpen, onClose, onConfirm, order, materials, vendors }) => {
  if (!isOpen) return null;

  const vendor = vendors.find(v => v.id === order.vendorId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Confirm Delivery: ${order.id}`}>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600">
            Please confirm that you have received the following items from <span className="font-semibold">{vendor?.name || 'Unknown Vendor'}</span>. This action will update the inventory.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Material</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Quantity</th>
                <th className="p-3 font-semibold text-gray-600">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.lineItems.map(item => {
                const material = materials.find(m => m.id === item.materialId);
                return (
                  <tr key={item.id}>
                    <td className="p-3">
                        <div className="font-medium text-gray-800">{material?.name || 'Unknown Material'}</div>
                        {item.specifications && <div className="text-xs text-gray-500 mt-1">{item.specifications}</div>}
                    </td>
                    <td className="p-3 text-right font-mono">{item.quantity}</td>
                    <td className="p-3">{item.unit}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition shadow-sm flex items-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Confirm Delivery
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryConfirmationModal;