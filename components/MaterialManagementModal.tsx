import React, { useState, useEffect } from 'react';
import { Material, PurchaseOrder } from '../types';
// FIX: Updated icon import path to './Icons' to resolve a filename casing conflict.
import { PencilIcon, TrashIcon } from './Icons';
import Modal from './Modal';
import { UNITS } from '../constants';
import ExcelUpload from './ExcelUpload';

interface MaterialManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  orders: PurchaseOrder[];
  onAddMaterial: (name: string, unit: string) => void;
  onUpdateMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  onBulkAdd: (data: { name: string, unit?: string }[]) => void;
}

const MaterialManagementModal: React.FC<MaterialManagementModalProps> = ({
  isOpen,
  onClose,
  materials,
  orders,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onBulkAdd,
}) => {
  const [isEditing, setIsEditing] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [materialUnit, setMaterialUnit] = useState(UNITS[0]);
  
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(null);
      setMaterialName('');
      setMaterialUnit(UNITS[0]);
    }
  }, [isOpen]);
  
  const handleEditClick = (material: Material) => {
    setIsEditing(material);
    setMaterialName(material.name);
    setMaterialUnit(material.unit);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setMaterialName('');
    setMaterialUnit(UNITS[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;

    if (isEditing) {
      onUpdateMaterial({ ...isEditing, name: materialName, unit: materialUnit });
    } else {
      onAddMaterial(materialName, materialUnit);
    }
    setMaterialName('');
    setMaterialUnit(UNITS[0]);
    setIsEditing(null);
  };

  const handleDelete = (materialId: string) => {
    const isMaterialInUse = orders.some(order => order.lineItems.some(li => li.materialId === materialId));
    if (isMaterialInUse) {
      alert('This material is used in existing orders and cannot be deleted.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      onDeleteMaterial(materialId);
    }
  };

  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Materials">
        <div className="space-y-6">
            <ExcelUpload<{ name: string, unit?: string }>
                onDataParsed={onBulkAdd}
                title="Bulk Upload Materials"
                instructions="Upload an Excel file with a header for <b>name</b>. A column for <b>unit</b> is optional (defaults to 'Nos.')."
            />

            {/* Add/Edit Form */}
            <form onSubmit={handleSubmit} className="pt-6 border-t border-gray-200 space-y-3">
                <h3 className="text-base font-semibold text-gray-800">{isEditing ? 'Edit Material' : 'Add a New Material'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="materialName" className="block mb-1.5 text-sm font-medium text-gray-600">Material Name</label>
                        <input
                            id="materialName"
                            type="text"
                            value={materialName}
                            onChange={(e) => setMaterialName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g., Plywood (18mm)"
                            required
                        />
                    </div>
                      <div>
                        <label htmlFor="materialUnit" className="block mb-1.5 text-sm font-medium text-gray-600">Default Unit</label>
                          <select id="materialUnit" value={materialUnit} onChange={e => setMaterialUnit(e.target.value)} className={inputClasses}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition flex-shrink-0 shadow-sm text-sm">
                        {isEditing ? 'Update' : 'Add'}
                    </button>
                    {isEditing && (
                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-white hover:bg-gray-100 rounded-md text-gray-800 font-medium transition flex-shrink-0 border border-gray-300 text-sm">
                        Cancel
                    </button>
                    )}
                </div>
            </form>

            {/* Material List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mr-2">
                {materials.map(material => (
                <div key={material.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                        <span className="text-gray-800 font-medium text-sm">{material.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({material.unit})</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <button onClick={() => handleEditClick(material)} className="text-gray-400 hover:text-primary-600 transition" title="Edit Material">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(material.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete Material">
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

export default MaterialManagementModal;