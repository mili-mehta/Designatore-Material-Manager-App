import React, { useState } from 'react';
import { PurchaseOrder, OrderStatus, Priority, Vendor, Material, User } from '../types';
// FIX: Changed icon import path from './icons' to './Icons' to resolve filename casing conflict.
import { CheckCircleIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, HandThumbUpIcon, HandThumbDownIcon } from './Icons';

interface OrderTableProps {
  orders: PurchaseOrder[];
  vendors: Vendor[];
  materials: Material[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onEditOrder: (order: PurchaseOrder) => void;
  onViewOrder: (order: PurchaseOrder) => void;
  onConfirmDelivery: (order: PurchaseOrder) => void;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (order: PurchaseOrder) => void;
  currentUser: User;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, vendors, materials, onUpdateOrderStatus, onEditOrder, onViewOrder, onApproveOrder, onRejectOrder, currentUser, onConfirmDelivery }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { role: currentUserRole, name: currentUserName } = currentUser;

  const handleCancelOrder = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel this order?')) {
      onUpdateOrderStatus(orderId, OrderStatus.Cancelled);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation();
    onEditOrder(order);
  };

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case Priority.Urgent: return 'bg-red-100 text-red-700';
      case Priority.High: return 'bg-amber-100 text-amber-700';
      case Priority.Low: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Delivered: return 'bg-green-100 text-green-700';
      case OrderStatus.Pending: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.AwaitingApproval: return 'bg-sky-100 text-sky-700';
      case OrderStatus.Cancelled: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const sortedOrders = [...orders].sort((a, b) => new Date(b.orderedOn).getTime() - new Date(a.orderedOn).getTime());

  const filteredOrders = sortedOrders.filter(order => {
    const vendor = vendors.find(v => v.id === order.vendorId);
    const searchTermLower = searchTerm.toLowerCase();

    const materialsInOrder = order.lineItems.map(li => materials.find(m => m.id === li.materialId)?.name || '').join(' ');

    return (
      vendor?.name.toLowerCase().includes(searchTermLower) ||
      order.id.toLowerCase().includes(searchTermLower) ||
      materialsInOrder.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center p-6">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Orders</h2>
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 border-transparent rounded-full py-2 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Items</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Priority</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordered On</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Delivery</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised By</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
                const vendor = vendors.find(v => v.id === order.vendorId);
                const firstMaterialName = materials.find(m => m.id === order.lineItems[0]?.materialId)?.name;

                return (
                    <tr key={order.id} onClick={() => onViewOrder(order)} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <td className="p-4">
                            <div className="font-medium text-gray-800">{firstMaterialName}</div>
                            {order.lineItems.length > 1 && <div className="text-sm text-gray-500">+ {order.lineItems.length - 1} more</div>}
                            <div className="text-xs text-gray-400 font-mono mt-1">{order.id}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{vendor?.name}</td>
                        <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityClass(order.priority)}`}>{order.priority}</span>
                        </td>
                        <td className="p-4 text-center">
                            {currentUserRole === 'inventory_manager' && order.status === OrderStatus.Pending ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onConfirmDelivery(order); }}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition shadow-sm"
                                    aria-label={`Mark order ${order.id} as delivered`}
                                >
                                    <CheckCircleIcon className="w-4 h-4" /> Mark Delivered
                                </button>
                            ) : (
                                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`}>
                                    {order.autoGenerated && order.status === OrderStatus.Pending ? 'Auto-Generated' : order.status}
                                </span>
                            )}
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-mono">{order.orderedOn}</td>
                        <td className="p-4 text-sm text-gray-600 font-mono">{order.expectedDelivery}</td>
                        <td className="p-4 text-sm text-gray-600">{order.raisedBy}</td>
                        <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {/* Manager: Approve/Reject */}
                                {currentUserRole === 'manager' && order.status === OrderStatus.AwaitingApproval && onApproveOrder && onRejectOrder && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); onApproveOrder(order.id); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition shadow-sm">
                                            <HandThumbUpIcon className="w-4 h-4" /> Approve
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onRejectOrder(order); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition shadow-sm">
                                            <HandThumbDownIcon className="w-4 h-4" /> Reject
                                        </button>
                                    </>
                                )}

                                {/* Edit Action */}
                                {( (currentUserRole === 'manager' && order.status === OrderStatus.Pending) ||
                                   (currentUserRole === 'purchaser' && order.raisedBy === currentUserName && [OrderStatus.Pending, OrderStatus.AwaitingApproval, OrderStatus.Cancelled].includes(order.status))
                                ) && (
                                    <button onClick={(e) => handleEditClick(e, order)} className="text-gray-400 hover:text-primary-600 transition" title="Edit">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                )}

                                {/* Mark as Delivered Action - now only for manager */}
                                {currentUserRole === 'manager' && order.status === OrderStatus.Pending && (
                                    <button onClick={(e) => { e.stopPropagation(); onConfirmDelivery(order); }} className="text-gray-400 hover:text-green-600 transition" title="Mark as Delivered">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                                
                                {/* Cancel Action */}
                                {( (currentUserRole === 'manager' && order.status === OrderStatus.Pending) ||
                                   (currentUserRole === 'purchaser' && order.raisedBy === currentUserName && order.status === OrderStatus.Pending)
                                ) && (
                                    <button onClick={(e) => handleCancelOrder(e, order.id)} className="text-gray-400 hover:text-red-600 transition" title="Cancel Order">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
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

export default OrderTable;