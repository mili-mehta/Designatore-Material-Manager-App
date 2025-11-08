import React, { useState, useEffect } from 'react';
import { Material, InventoryItem } from '../types';
import Modal from './Modal';
import { translations } from '../translations';
import { UNITS } from '../constants';
// FIX: Standardized icon import path to use './Icons' to resolve file casing conflicts in the build system.
import { PlusIcon, TrashIcon } from './Icons';
import ExcelUpload from './ExcelUpload';

// A simple i18n helper
const t = (key: string) => translations.en[key] || key;

interface BulkStockItem {
    name: string;
    unit: string;
    quantity: number;
    threshold: number;
}

interface OpeningStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    updatedStocks: { materialId: string; quantity: number }[];
    newItems: { name: string; unit: string; quantity: number }[];
  }) => void;
  onBulkSet: (data: BulkStockItem[]) => void;
  materials: Material[];
  inventory: InventoryItem[];
}

interface StockLevel {
  materialId: string;
  quantity: number;
}

interface NewItem {
    name: string;
    unit: string;
    quantity: string;
}

const OpeningStockModal: React.FC<OpeningStockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onBulkSet,
  materials,
  inventory,
}) => {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [newlyAdded, setNewlyAdded] = useState<NewItem[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialSpecs, setNewMaterialSpecs] = useState('');
  const [newMaterialBrand, setNewMaterialBrand] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState(UNITS[0]);
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialStock = materials.map(material => {
        const inventoryItem = inventory.find(item => item.id === material.id);
        return {
          materialId: material.id,
          quantity: inventoryItem ? inventoryItem.quantity : 0,
        };
      });
      setStockLevels(initialStock);
      setNewlyAdded([]);
    } else {
        setNewMaterialName('');
        setNewMaterialSpecs('');
        setNewMaterialBrand('');
        setNewMaterialUnit(UNITS[0]);
        setNewMaterialQuantity('');
    }
  }, [isOpen, materials, inventory]);

  const handleQuantityChange = (materialId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    setStockLevels(prev =>
      prev.map(stock =>
        stock.materialId === materialId ? { ...stock, quantity: isNaN(quantity) ? 0 : quantity } : stock
      )
    );
  };
  
  const handleAddToList = () => {
    const nameText = newMaterialName.trim();
    if (!nameText || !newMaterialQuantity.trim()) {
      alert('Please provide a name and quantity for the new material.');
      return;
    }

    const details = [];
    if (newMaterialSpecs.trim()) details.push(newMaterialSpecs.trim());
    if (newMaterialBrand.trim()) details.push(newMaterialBrand.trim());

    const combinedName = details.length > 0 ? `${nameText} (${details.join(', ')})` : nameText;
    
    if(materials.some(m => m.name.toLowerCase() === combinedName.toLowerCase()) || newlyAdded.some(item => item.name.toLowerCase() === combinedName.toLowerCase())) {
        alert('A material with this name already exists.');
        return;
    }

    setNewlyAdded([...newlyAdded, { name: combinedName, unit: newMaterialUnit, quantity: newMaterialQuantity }]);
    setNewMaterialName('');
    setNewMaterialSpecs('');
    setNewMaterialBrand('');
    setNewMaterialUnit(UNITS[0]);
    setNewMaterialQuantity('');
  };

  const handleRemoveFromList = (indexToRemove: number) => {
    setNewlyAdded(newlyAdded.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
        updatedStocks: stockLevels, 
        newItems: newlyAdded.map(item => ({ ...item, quantity: Number(item.quantity) || 0 }))
    });
  };
  
  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm text-sm";
  const smallInputClasses = `text-xs ${inputClasses}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('setOpeningStock')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Set the initial or current stock quantity for each material. This will update the main inventory records. You can update manually or upload an Excel file.
        </p>

        <ExcelUpload<BulkStockItem>
            onDataParsed={onBulkSet}
            title="Bulk Upload Stock Levels"
            instructions="Upload an Excel file with headers: <b>name</b>, <b>unit</b>, <b>quantity</b>, <b>threshold</b>. Existing materials will be updated; new materials will be created."
        />

        <div className="max-h-[30vh] overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {materials.map(material => {
            const stock = stockLevels.find(s => s.materialId === material.id);
            return (
              <div key={material.id} className="grid grid-cols-5 gap-4 items-center">
                <label className="col-span-3 text-sm font-medium text-gray-700">{material.name}</label>
                 <span className="text-xs text-gray-500 text-right">{material.unit}</span>
                <input
                  type="number"
                  value={stock ? stock.quantity : 0}
                  onChange={e => handleQuantityChange(material.id, e.target.value)}
                  className={`${inputClasses} text-right`}
                  min="0"
                  step="any"
                />
              </div>
            );
          })}
        </div>
        
        {/* Add New Material Section */}
        <div className="pt-4 mt-4 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">{t('addNewMaterialInStock')}</h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">{t('materialName')}</label>
                        <input type="text" value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder={t('materialNamePlaceholder')} className={smallInputClasses}/>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">{t('specifications')}</label>
                        <input type="text" value={newMaterialSpecs} onChange={e => setNewMaterialSpecs(e.target.value)} placeholder="e.g., 8mm, Grade A" className={smallInputClasses}/>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">{t('brand')}</label>
                        <input type="text" value={newMaterialBrand} onChange={e => setNewMaterialBrand(e.target.value)} placeholder="e.g., Greenlam" className={smallInputClasses}/>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">{t('unit')}</label>
                        <select value={newMaterialUnit} onChange={e => setNewMaterialUnit(e.target.value)} className={smallInputClasses}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-xs font-medium text-gray-600">{t('quantity')}</label>
                        <input type="number" value={newMaterialQuantity} onChange={e => setNewMaterialQuantity(e.target.value)} placeholder="0" min="0" className={smallInputClasses}/>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleAddToList} className="px-4 py-2 bg-white hover:bg-gray-100 rounded-md text-gray-800 font-medium transition flex-shrink-0 border border-gray-300 text-sm flex items-center justify-center gap-1.5">
                        <PlusIcon className="w-4 h-4" /> {t('addToList')}
                    </button>
                </div>
            </div>
        </div>

        {newlyAdded.length > 0 && (
            <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-600">{t('stagedForAddition')}</h5>
                <div className="max-h-28 overflow-y-auto space-y-2 pr-2">
                    {newlyAdded.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded-md border text-sm">
                            <span className="font-medium text-gray-700">{item.name} <span className="text-gray-500 font-normal">({item.quantity} {item.unit})</span></span>
                            <button type="button" onClick={() => handleRemoveFromList(index)} className="text-red-500 hover:text-red-700 p-1" title={t('remove')}>
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">
            {t('cancel')}
          </button>
          <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">
            {t('updateStockLevels')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OpeningStockModal;