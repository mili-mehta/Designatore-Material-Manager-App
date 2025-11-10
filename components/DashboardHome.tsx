import React, { useMemo } from 'react';
import { User, PurchaseOrder, OrderStatus, PurchaseIntent, PurchaseIntentStatus, Vendor, Material, InventoryItem } from '../types';
import { useAppContext } from '../context/AppContext';
import StatCard from './StatCard';
import LowStockAlerts from './LowStockAlerts';
import OrderTable from './OrderTable';
import PurchaseIntentsTable from './PurchaseIntentsTable';
// FIX: Standardized icon import to use './icons' to resolve filename casing conflict.
import { ArchiveBoxIcon, AlertTriangleIcon, ClipboardDocumentCheckIcon } from './icons';

interface DashboardHomeProps {
    currentUser: User;
    onEditOrder: (order: PurchaseOrder) => void;
    onViewOrder: (order: PurchaseOrder) => void;
    onConfirmDelivery: (order: PurchaseOrder) => void;
    onApproveOrder?: (orderId: string) => void;
    onRejectOrder?: (order: PurchaseOrder) => void;
    onCreateOrderForLowStock: (materialId: string) => void;
    onViewIntent: (intent: PurchaseIntent) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
    currentUser, 
    onEditOrder, 
    onViewOrder, 
    onConfirmDelivery,
    onApproveOrder, 
    onRejectOrder,
    onCreateOrderForLowStock,
    onViewIntent,
 }) => {
    const { inventory, orders, purchaseIntents, vendors, materials } = useAppContext();

    const activeOrders = useMemo(() => orders.filter(o => o.status !== OrderStatus.Delivered && o.status !== OrderStatus.Cancelled), [orders]);
    const lowStockItems = useMemo(() => inventory.filter(i => i.quantity <= i.threshold), [inventory]);
    const intentsAwaitingReview = useMemo(() => purchaseIntents.filter(i => i.status === PurchaseIntentStatus.Pending), [purchaseIntents]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Active Orders"
                    value={activeOrders.length}
                    icon={<ArchiveBoxIcon className="w-6 h-6 text-primary-700" />}
                    colorClass="bg-primary-100"
                />
                <StatCard 
                    title="Low Stock Items"
                    value={lowStockItems.length}
                    icon={<AlertTriangleIcon className="w-6 h-6 text-amber-700" />}
                    colorClass="bg-amber-100"
                />
                 <StatCard 
                    title="Intents for Review"
                    value={intentsAwaitingReview.length}
                    icon={<ClipboardDocumentCheckIcon className="w-6 h-6 text-sky-700" />}
                    colorClass="bg-sky-100"
                />
            </div>
            {currentUser.role !== 'purchaser' && <LowStockAlerts lowStockItems={lowStockItems} onCreateOrder={onCreateOrderForLowStock} />}
            {currentUser.role === 'purchaser' && intentsAwaitingReview.length > 0 && 
                <PurchaseIntentsTable 
                    title="Intents Awaiting Your Review"
                    intents={intentsAwaitingReview}
                    materials={materials}
                    currentUser={currentUser}
                    onViewIntent={onViewIntent}
                />
            }
            <OrderTable 
                orders={activeOrders} 
                vendors={vendors} 
                materials={materials} 
                onUpdateOrderStatus={(orderId, status) => { /* handled in context */ }} 
                onEditOrder={onEditOrder} 
                onViewOrder={onViewOrder}
                onApproveOrder={onApproveOrder}
                onRejectOrder={onRejectOrder}
                currentUser={currentUser}
                onConfirmDelivery={onConfirmDelivery}
            />
        </div>
    );
};

export default DashboardHome;