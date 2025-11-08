import React, { useState, useEffect } from 'react';
import { Site, PurchaseOrder } from '../types';
// FIX: Standardized icon import path to use './Icons' to resolve file casing conflicts in the build system.
import { PencilIcon, TrashIcon } from './Icons';
import Modal from './Modal';
import ExcelUpload from './ExcelUpload';

interface SiteManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  orders: PurchaseOrder[];
  onAddSite: (name: string) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onBulkAdd: (data: { name: string }[]) => void;
}

const SiteManagementModal: React.FC<SiteManagementModalProps> = ({
  isOpen,
  onClose,
  sites,
  orders,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  onBulkAdd,
}) => {
  const [isEditing, setIsEditing] = useState<Site | null>(null);
  const [siteName, setSiteName] = useState('');
  
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(null);
      setSiteName('');
    }
  }, [isOpen]);
  
  const handleEditClick = (site: Site) => {
    setIsEditing(site);
    setSiteName(site.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setSiteName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;

    if (isEditing) {
      onUpdateSite({ ...isEditing, name: siteName });
    } else {
      onAddSite(siteName);
    }
    setSiteName('');
    setIsEditing(null);
  };

  const handleDelete = (siteToDelete: Site) => {
    const isSiteInUse = orders.some(order => 
        order.lineItems.some(li => li.site === siteToDelete.name)
    );
    if (isSiteInUse) {
      alert('This site/client is used in existing orders and cannot be deleted.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this site/client? This action cannot be undone.')) {
      onDeleteSite(siteToDelete.id);
    }
  };

  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Sites/Clients">
        <div className="space-y-6">
            <ExcelUpload<{ name: string }>
                onDataParsed={onBulkAdd}
                title="Bulk Upload Sites/Clients"
                instructions="Upload an Excel file with a single column header: <b>name</b>."
            />
            {/* Add/Edit Form */}
            <form onSubmit={handleSubmit} className="pt-6 border-t border-gray-200 space-y-3">
                <h3 className="text-base font-semibold text-gray-800">{isEditing ? 'Edit Site/Client' : 'Add a New Site/Client'}</h3>
                <div>
                    <label htmlFor="siteName" className="block mb-1.5 text-sm font-medium text-gray-600">Site/Client Name</label>
                    <div className="flex gap-2">
                        <input
                        id="siteName"
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className={inputClasses}
                        placeholder="Enter site or client name"
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

            {/* Site List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mr-2">
                {sites.map(site => (
                <div key={site.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-800 font-medium text-sm">{site.name}</span>
                    <div className="flex items-center gap-3">
                    <button onClick={() => handleEditClick(site)} className="text-gray-400 hover:text-primary-600 transition" title="Edit Site/Client">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(site)} className="text-gray-400 hover:text-red-600 transition" title="Delete Site/Client">
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

export default SiteManagementModal;