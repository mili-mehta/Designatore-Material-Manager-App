import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Vendor, Priority, OrderLineItem, Material, Site } from '../types';
import { UNITS } from '../constants';
// FIX: Standardized icon import to use './icons' (lowercase) to resolve filename casing conflict.
import { PlusIcon, TrashIcon, ChevronDownIcon } from './icons';

interface EditOrderFormProps {
  order: PurchaseOrder;
  onUpdateOrder: (order: PurchaseOrder) => void;
  onClose: () => void;
  vendors: Vendor[];
  materials: Material[];
  sites: Site[];
}

type FormOrderLineItem = Partial<OrderLineItem> & { _materialNameInput?: string };

const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onUpdateOrder, onClose, vendors, materials, sites }) => {
  const sortedVendors = useMemo(() => [...vendors].sort((a, b) => a.name.localeCompare(b.name)), [vendors]);
  const sortedMaterials = useMemo(() => [...materials].sort((a, b) => a.name.localeCompare(b.name)), [materials]);
  const sortedSites = useMemo(() => [...sites].sort((a, b) => a.name.localeCompare(b.name)), [sites]);
  
  const [vendorId, setVendorId] = useState<string>(order.vendorId);
  const [vendorNameInput, setVendorNameInput] = useState<string>(
    vendors.find(v => v.id === order.vendorId)?.name || ''
  );
  const [priority, setPriority] = useState<Priority>(order.priority);
  const [expectedDelivery, setExpectedDelivery] = useState<string>(order.expectedDelivery);
  const [notes, setNotes] = useState(order.notes || '');
  const [lineItems, setLineItems] = useState<FormOrderLineItem[]>(
    order.lineItems.map(li => ({
        ...li,
        _materialNameInput: materials.find(m => m.id === li.materialId)?.name || ''
    }))
  );
  
  const [openSections, setOpenSections] = useState({ details: true, notes: !!order.notes });


  const toggleSection = (section: 'details' | 'notes') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleVendorChange = (name: string) => {
    setVendorNameInput(name);
    const vendor = vendors.find(v => v.name === name);
    setVendorId(vendor ? vendor.id : '');
  };

  const handleLineItemChange = (index: number, field: keyof FormOrderLineItem, value: any) => {
    const updatedLineItems = [...lineItems];
    const currentItem = { ...updatedLineItems[index] };

    if (field === '_materialNameInput') {
        currentItem._materialNameInput = value;
        const material = materials.find(m => m.name === value);
        if (material) {
            currentItem.materialId = material.id;
            currentItem.unit = material.unit;
        } else {
            currentItem.materialId = undefined;
        }
    } else {
        (currentItem as any)[field] = value;
    }
    
    updatedLineItems[index] = currentItem;
    setLineItems(updatedLineItems);
  };

  const addLineItem = () => setLineItems([...lineItems, { _materialNameInput: '' }]);
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };
  
  const calculateLineTotal = (item: Partial<OrderLineItem>) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discount) || 0;
    const gst = Number(item.gst) || 0;
    const freight = Number(item.freight) || 0;

    const grossAmount = quantity * rate;
    const discountAmount = grossAmount * (discountPercent / 100);
    const subTotal = grossAmount - discountAmount;
    const gstAmount = subTotal * (gst / 100);
    return subTotal + gstAmount + freight;
  };

  const totalInvoiceAmount = lineItems.reduce((total, item) => total + calculateLineTotal(item), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!vendorId) {
      alert("Please select a vendor.");
      return;
    }
    
    const finalLineItems: OrderLineItem[] = lineItems
        .filter(item => item.materialId && item.quantity && item.rate && item.unit)
        .map(item => ({
            id: item.id || `LI-${Date.now()}-${Math.random()}`,
            orderId: order.id,
            materialId: item.materialId!,
            specifications: item.specifications || '',
            quantity: Number(item.quantity!),
            size: item.size,
            unit: item.unit!,
            brand: item.brand,
            site: item.site,
            rate: Number(item.rate!),
            discount: item.discount ? Number(item.discount) : undefined,
            gst: Number(item.gst || 18),
            freight: item.freight ? Number(item.freight) : undefined,
        }));

    if (finalLineItems.length === 0) {
        alert("Please add at least one valid material item to the order.");
        return;
    }

    const updatedOrder: PurchaseOrder = {
      ...order,
      vendorId: vendorId,
      lineItems: finalLineItems,
      notes,
      priority,
      expectedDelivery,
    };
    onUpdateOrder(updatedOrder);
    onClose();
  };

  const inputClasses = "w-full bg-white border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";
  const smallInputClasses = `text-sm ${inputClasses}`;
  const labelClasses = "block mb-1.5 text-sm font-medium text-gray-600";
  const smallLabelClasses = "block mb-1 text-xs font-medium text-gray-500";


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gray-200 rounded-lg">
        <button type="button" onClick={() => toggleSection('details')} className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-t-lg">
          <h3 className="text-md font-semibold text-gray-800">Order Details</h3>
          <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${openSections.details ? 'rotate-180' : ''}`} />
        </button>
        {openSections.details && (
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClasses}>Vendor</label>
                        <input
                            type="text"
                            list="vendors-list"
                            value={vendorNameInput}
                            onChange={e => handleVendorChange(e.target.value)}
                            className={inputClasses}
                            placeholder="Select or Search Vendor"
                            required
                        />
                        <datalist id="vendors-list">
                            {sortedVendors.map(v => <option key={v.id} value={v.name} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className={labelClasses}>Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={inputClasses}>
                            {/* FIX: Explicitly cast value to string to satisfy React's key/value prop types. */}
                            {Object.values(Priority).map(p => <option key={String(p)} value={String(p)}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Expected Delivery</label>
                        <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} className={inputClasses} min={new Date().toISOString().split('T')[0]} required />
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-800">Order Items</h3>
        {lineItems.map((item, index) => (
          <div key={index} className="p-5 bg-gray-50 rounded-lg space-y-4 relative border border-gray-200">
             <button type="button" onClick={() => removeLineItem(index)} className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400" disabled={lineItems.length <= 1} title="Remove Item">
                <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className={smallLabelClasses}>Material</label>
                    <input
                        type="text"
                        list="materials-list"
                        value={item._materialNameInput || ''}
                        onChange={e => handleLineItemChange(index, '_materialNameInput', e.target.value)}
                        placeholder="Select or Search Material"
                        className={smallInputClasses}
                        required
                    />
                    <datalist id="materials-list">
                        {sortedMaterials.map(m => <option key={m.id} value={m.name} />)}
                    </datalist>
                </div>
                <div>
                    <label className={smallLabelClasses}>Brand</label>
                    <input type="text" value={item.brand || ''} onChange={e => handleLineItemChange(index, 'brand', e.target.value)} placeholder="e.g., Greenlam" className={smallInputClasses} />
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
                        {sortedSites.map(site => <option key={site.id} value={site.name} />)}
                    </datalist>
                </div>
            </div>

            <div>
                <label className={smallLabelClasses}>Specifications</label>
                <textarea value={item.specifications || ''} onChange={e => handleLineItemChange(index, 'specifications', e.target.value)} className={`${smallInputClasses} min-h-[60px]`} placeholder="e.g., Grade A, termite resistant..."></textarea>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                 <div>
                    <label className={smallLabelClasses}>Size</label>
                    <input type="text" value={item.size || ''} onChange={e => handleLineItemChange(index, 'size', e.target.value)} placeholder="e.g., 8x4 ft" className={smallInputClasses} />
                </div>
                <div>
                    <label className={smallLabelClasses}>Rate per Unit</label>
                    <input type="number" value={item.rate || ''} onChange={e => handleLineItemChange(index, 'rate', e.target.value)} placeholder="0.00" min="0" step="0.01" className={smallInputClasses} required/>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end pt-4 border-t border-gray-200">
                <div>
                    <label className={smallLabelClasses}>Discount %</label>
                    <input type="number" value={item.discount || ''} onChange={e => handleLineItemChange(index, 'discount', e.target.value)} placeholder="0" min="0" max="100" className={smallInputClasses} />
                </div>
                <div>
                    <label className={smallLabelClasses}>GST %</label>
                    <input type="number" value={item.gst || ''} onChange={e => handleLineItemChange(index, 'gst', e.target.value)} placeholder="18" className={smallInputClasses} />
                </div>
                <div>
                    <label className={smallLabelClasses}>Freight</label>
                    <input type="number" value={item.freight || ''} onChange={e => handleLineItemChange(index, 'freight', e.target.value)} placeholder="0.00" className={smallInputClasses} />
                </div>
                <div className="md:col-span-2 text-right">
                    <label className={smallLabelClasses}>Item Total</label>
                    <p className="font-semibold text-xl text-gray-800">₹{calculateLineTotal(item).toFixed(2)}</p>
                </div>
            </div>
          </div>
        ))}
      </div>
        
      <button type="button" onClick={addLineItem} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition border border-gray-300">
        <PlusIcon className="w-5 h-5" /> Add Another Material
      </button>

      <div className="border border-gray-200 rounded-lg">
        <button type="button" onClick={() => toggleSection('notes')} className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-t-lg">
          <h3 className="text-md font-semibold text-gray-800">Notes</h3>
          <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${openSections.notes ? 'rotate-180' : ''}`} />
        </button>
        {openSections.notes && (
          <div className="p-4">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClasses} min-h-[80px]`} placeholder="Any overall notes for this purchase order..."></textarea>
          </div>
        )}
      </div>

       <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div>
            <span className="text-sm font-medium text-gray-600">Total Invoice Amount:</span>
            <p className="font-bold text-3xl text-gray-900 tracking-tight">₹{totalInvoiceAmount.toFixed(2)}</p>
        </div>
        <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">Close</button>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">Update Order</button>
        </div>
      </div>
    </form>
  );
};

export default EditOrderForm;