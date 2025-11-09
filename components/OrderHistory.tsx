import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Vendor, OrderStatus, Material } from '../types';
// FIX: Changed icon import path from './icons' to './Icons' to resolve filename casing conflict.
import { MagnifyingGlassIcon } from './Icons';

interface OrderHistoryProps {
    orders: PurchaseOrder[];
    vendors: Vendor[];
    materials: Material[];
    onBack: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, vendors, materials, onBack }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusClass = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Delivered: return 'bg-green-100 text-green-700';
            case OrderStatus.Cancelled: return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedMaterialId('');
        setSearchTerm('');
    };

    const filteredOrders = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase();
        return orders
            .filter(order => order.status === OrderStatus.Delivered || order.status === OrderStatus.Cancelled)
            .filter(order => {
                if (!startDate || !endDate) return true;
                const orderedDate = new Date(order.orderedOn);
                return orderedDate >= new Date(startDate) && orderedDate <= new Date(endDate);
            })
            .filter(order => {
                if (!selectedMaterialId) return true;
                return order.lineItems.some(li => li.materialId === selectedMaterialId);
            })
            .filter(order => {
                const vendor = vendors.find(v => v.id === order.vendorId);
                const materialsInOrder = order.lineItems.map(li => materials.find(m => m.id === li.materialId)?.name || '').join(' ');
                return (
                  vendor?.name.toLowerCase().includes(searchTermLower) ||
                  order.id.toLowerCase().includes(searchTermLower) ||
                  materialsInOrder.toLowerCase().includes(searchTermLower)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(a.deliveredOn || a.orderedOn).getTime();
                const dateB = new Date(b.deliveredOn || b.orderedOn).getTime();
                return dateB - dateA;
            });
    }, [orders, startDate, endDate, selectedMaterialId, searchTerm, vendors, materials]);

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
                                placeholder="Search by Material, Vendor, or ID..."
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
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Items</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered On</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Finalized On</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => {
                            const vendor = vendors.find(v => v.id === order.vendorId);
                            const firstMaterialName = materials.find(m => m.id === order.lineItems[0]?.materialId)?.name;
                            return (
                                <tr key={order.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{firstMaterialName}</div>
                                        {order.lineItems.length > 1 && <div className="text-sm text-gray-500">+ {order.lineItems.length - 1} more</div>}
                                        <div className="text-xs text-gray-400 font-mono mt-1">{order.id}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{vendor?.name}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-mono">{order.orderedOn}</td>
                                    <td className="p-4 text-sm text-gray-600 font-mono">{order.deliveredOn || '---'}</td>
                                    <td className="p-4 text-sm text-gray-600">{order.raisedBy}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredOrders.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p className="font-medium">No historical orders match your criteria.</p>
                        <p className="text-sm">Try adjusting or resetting your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;