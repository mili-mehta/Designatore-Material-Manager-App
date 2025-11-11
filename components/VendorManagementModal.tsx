import React, { useState, useEffect } from 'react';
import { Vendor, PurchaseOrder } from '../types';
// FIX: Standardized icon import to use './icons' (lowercase) to resolve filename casing conflict.
import { PencilIcon, TrashIcon } from './icons';
import Modal from './Modal';
import ExcelUpload from './ExcelUpload';
import { useAppContext } from '../context/AppContext';

interface VendorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  orders: PurchaseOrder[];
  onAddVendor: (name: string) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onBulkAdd: (data: { name: string }[]) => void;
}

const VendorManagementModal: React.FC<VendorManagementModalProps> = ({
  isOpen,
  onClose,
  vendors,
  orders,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onBulkAdd,
}) => {
  const [isEditing, setIsEditing] = useState<Vendor | null>(null);
  const [vendorName, setVendorName] = useState('');
  const { addNotification } = useAppContext();
  
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(null);
      setVendorName('');
    }
  }, [isOpen]);
  
  const handleEditClick = (vendor: Vendor) => {
    setIsEditing(vendor);
    setVendorName(vendor.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setVendorName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    if (isEditing) {
      onUpdateVendor({ ...isEditing, name: vendorName });
    } else {
      onAddVendor(vendorName);
    }
    setVendorName('');
    setIsEditing(null);
  };

  const handleDelete = (vendorId: string) => {
    const isVendorInUse = orders.some(order => order.vendorId === vendorId);
    if (isVendorInUse) {
      addNotification('warning', 'This vendor is associated with existing orders and cannot be deleted.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      onDeleteVendor(vendorId);
    }
  };

  const inputClasses = "w-full bg-gray-50 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Vendors">
        <div className="space-y-6">
            <ExcelUpload<{ name: string }>
                onDataParsed={onBulkAdd}
                title="Bulk Upload Vendors"
                instructions="Upload an Excel file with a single column header: <b>name</b>."
            />

            <form onSubmit={handleSubmit} className="pt-6 border-t border-gray-200 space-y-3">
                <h3 className="text-base font-semibold text-gray-800">{isEditing ? 'Edit Vendor' : 'Add a New Vendor'}</h3>
                <div>
                    <label htmlFor="vendorName" className="block mb-1.5 text-sm font-medium text-gray-600">Vendor Name</label>
                    <div className="flex gap-2">
                        <input
                        id="vendorName"
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className={inputClasses}
                        placeholder="Enter vendor name"
                        required
                        />
                        <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition flex-shrink-0 shadow-sm text-sm">
                            {isEditing ? 'Update' : 'Add'}
                        </button>
                        {isEditing && (
                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-white hover:bg-gray-100 rounded-md text-gray-800 font-medium transition flex-shrink-0 border border-gray-300 text-sm">
                            Cancel
                        </button>
                        )}
                    </div>
                </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mr-2">
                {vendors.map(vendor => (
                <div key={vendor.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-800 font-medium text-sm">{vendor.name}</span>
                    <div className="flex items-center gap-3">
                    <button onClick={() => handleEditClick(vendor)} className="text-gray-400 hover:text-primary-600 transition" title="Edit Vendor">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(vendor.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete Vendor">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    </div>
                </div>
                ))}
            </div>
        </div>
    </Modal>
  );
};

export default VendorManagementModal;