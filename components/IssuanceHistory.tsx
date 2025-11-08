



import React, { useState, useMemo } from 'react';
import { MaterialIssuance, Site, Material } from '../types';
// FIX: Standardized icon import path to use './Icons' to resolve file casing conflicts.
import { MagnifyingGlassIcon } from './Icons';

interface IssuanceHistoryProps {
    issuances: MaterialIssuance[];
    materials: Material[];
    sites: Site[];
    onBack: () => void;
}

const IssuanceHistory: React.FC<IssuanceHistoryProps> = ({ issuances, materials, sites, onBack }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedMaterialId('');
        setSearchTerm('');
    };

    const filteredIssuances = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase();
        return issuances
            .filter(issue => {
                if (!startDate || !endDate) return true;
                const issuedDate = new Date(issue.issuedOn);
                return issuedDate >= new Date(startDate) && issuedDate <= new Date(endDate);
            })
            .filter(issue => {
                if (!selectedMaterialId) return true;
                // FIX: Removed parseInt as materialId is a string.
                return issue.materialId === selectedMaterialId;
            })
            .filter(issue => {
                const material = materials.find(m => m.id === issue.materialId);
                return (
                  material?.name.toLowerCase().includes(searchTermLower) ||
                  issue.id.toLowerCase().includes(searchTermLower) ||
                  issue.issuedToSite.toLowerCase().includes(searchTermLower) ||
                  issue.issuedBy.toLowerCase().includes(searchTermLower)
                );
            })
            .sort((a, b) => new Date(b.issuedOn).getTime() - new Date(a.issuedOn).getTime());
    }, [issuances, startDate, endDate, selectedMaterialId, searchTerm, materials]);

    const inputClasses = "w-full bg-white border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm";
    
    return (
        <div className="bg-white rounded-xl shadow-sm">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="lg:col-span-2">
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Material, Site, or Issued By..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${inputClasses} pl-10`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-600">Filter by Material</label>
                        <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className={inputClasses}>
                            <option value="">All Materials</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block mb-1.5 text-sm font-medium text-gray-600">Filter by Date Range</label>
                        <div className="flex gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses} placeholder="Start Date" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses} placeholder="End Date" min={startDate} />
                        </div>
                    </div>
                </div>
                 <div className="mt-4">
                    <button onClick={resetFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition text-sm">
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Material</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantity Issued</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued To (Site)</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued On</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIssuances.map((issue) => {
                            const material = materials.find(m => m.id === issue.materialId);
                            return (
                                <tr key={issue.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{material?.name}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-1">{issue.id}</div>
                                        {issue.notes && <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={issue.notes}>Notes: {issue.notes}</div>}
                                    </td>

                                    <td className="p-4 text-right text-sm text-gray-600 font-mono">{issue.quantity} {issue.unit}</td>
                                    <td className="p-4 text-sm text-gray-600">{issue.issuedToSite}</td>
                                    <td className="p-4 text-sm text-gray-600 font-mono">{issue.issuedOn}</td>
                                    <td className="p-4 text-sm text-gray-600">{issue.issuedBy}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredIssuances.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p className="font-medium">No issuance records match your criteria.</p>
                        <p className="text-sm">Try adjusting or resetting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuanceHistory;