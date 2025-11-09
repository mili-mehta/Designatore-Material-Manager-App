import React, { useState, useContext, useMemo } from 'react';
import { User, PurchaseOrder, OrderStatus, PurchaseIntent, PurchaseIntentStatus, Vendor, Material, Site, InventoryItem } from '../types';
import { AppContext, useAppContext } from '../context/AppContext';
import InventoryTable from './InventoryTable';
import OrderTable from './OrderTable';
import NewOrderForm from './NewOrderForm';
import EditOrderForm from './EditOrderForm';
import OrderDetailsModal from './OrderDetailsModal';
import Modal from './Modal';
import VendorManagementModal from './VendorManagementModal';
import MaterialManagementModal from './MaterialManagementModal';
import LowStockAlerts from './LowStockAlerts';
import OrderHistory from './OrderHistory';
import SiteManagementModal from './SiteManagementModal';
import Reports from './Reports';
import IssueMaterialForm from './IssueMaterialForm';
import IssuanceHistory from './IssuanceHistory';
import RejectOrderModal from './RejectOrderModal';
import NewPurchaseIntentForm from './NewPurchaseIntentForm';
import PurchaseIntentsTable from './PurchaseIntentsTable';
import RejectionModal from './RejectionModal';
import OpeningStockModal from './OpeningStockModal';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';

import { 
    Squares2X2Icon, 
    ArchiveBoxIcon, 
    ClipboardDocumentListIcon, 
    ChartBarIcon,
    BuildingOfficeIcon,
    ReceiptRefundIcon,
    DocumentPlusIcon,
    ClipboardDocumentCheckIcon,
    // FIX: Added PlusIcon to the import list to resolve 'Cannot find name' error.
    PlusIcon,
    Bars3Icon,
    XMarkIcon
} from './icons';


type View = 'dashboard' | 'inventory' | 'order_history' | 'reports' | 'issuance_history' | 'intents_all';

const Dashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const {
        inventory,
        orders,
        vendors,
        materials,
        sites,
        issuances,
        purchaseIntents,
        addOrder,
        updateOrder,
        addVendor,
        updateVendor,
        deleteVendor,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addSite,
        updateSite,
        deleteSite,
        issueMaterial,
        approveOrder,
        rejectOrder,
        addPurchaseIntent,
        approvePurchaseIntent,
        rejectPurchaseIntent,
        convertIntentToOrder,
        setOpeningStock,
        addBulkStock,
        addBulkMaterials,
        addBulkVendors,
        addBulkSites,
        markOrderAsDelivered,
        updateInventoryItem,
    } = useAppContext();
    
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
    const [isIntentRejectModalOpen, setIsIntentRejectModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isDeliveryConfirmModalOpen, setIsDeliveryConfirmModalOpen] = useState(false);

    // FIX: Changed state to allow Partial<PurchaseOrder> to handle creating orders from intents, which are partial.
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | Partial<PurchaseOrder> | null>(null);
    const [selectedIntent, setSelectedIntent] = useState<PurchaseIntent | null>(null);

    const handleEditOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsEditOrderModalOpen(true);
    };

    const handleViewOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleRejectOrderClick = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };

    const handleRejectOrderSubmit = (reason: string) => {
        // FIX: Added a guard to ensure selectedOrder is a full PurchaseOrder before accessing its id.
        if (selectedOrder && 'id' in selectedOrder) {
            rejectOrder(selectedOrder.id, reason, currentUser.name || 'Manager');
        }
        setIsRejectModalOpen(false);
        setSelectedOrder(null);
    };

    const handleCreateOrderFromIntent = (intent: PurchaseIntent) => {
        const orderData = convertIntentToOrder(intent.id);
        setSelectedOrder(orderData); // This is a partial PO
        setIsNewOrderModalOpen(true);
    };
    
    const handleRejectIntentClick = (intent: PurchaseIntent) => {
        setSelectedIntent(intent);
        setIsIntentRejectModalOpen(true);
    };
    
    const handleRejectIntentSubmit = (reason: string) => {
        if (selectedIntent) {
            rejectPurchaseIntent(selectedIntent.id, reason, currentUser.name || 'Manager');
        }
        setIsIntentRejectModalOpen(false);
        setSelectedIntent(null);
    };

    const handleConfirmDeliveryClick = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsDeliveryConfirmModalOpen(true);
    };

    const handleConfirmDelivery = () => {
        // FIX: Added a guard to ensure selectedOrder is a full PurchaseOrder before accessing its id.
        if (selectedOrder && 'id' in selectedOrder) {
            markOrderAsDelivered(selectedOrder.id, currentUser.name || '');
        }
        setIsDeliveryConfirmModalOpen(false);
        setSelectedOrder(null);
    };
    
    const handleCreateOrderForLowStock = (materialId: string) => {
        const material = materials.find(m => m.id === materialId);
        const lowStockItem = inventory.find(i => i.id === materialId);
        if (!material || !lowStockItem) return;

        const newPartialOrder: Partial<PurchaseOrder> = {
            lineItems: [{
                id: `LI-lowstock-${Date.now()}`,
                materialId: material.id,
                quantity: lowStockItem.threshold * 2, // Suggest ordering double the threshold
                unit: material.unit,
                specifications: '',
                rate: 0,
                gst: 18,
            }]
        };
        setSelectedOrder(newPartialOrder);
        setIsNewOrderModalOpen(true);
    };


    const activeOrders = useMemo(() => orders.filter(o => o.status !== OrderStatus.Delivered && o.status !== OrderStatus.Cancelled), [orders]);
    const lowStockItems = useMemo(() => inventory.filter(i => i.quantity <= i.threshold), [inventory]);
    const intentsAwaitingReview = useMemo(() => purchaseIntents.filter(i => i.status === PurchaseIntentStatus.Pending), [purchaseIntents]);

    const SideNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
        <button onClick={() => { onClick(); setIsSidebarOpen(false); }} className={`flex items-center w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            {icon}
            {label}
        </button>
    );

    const renderView = () => {
        switch(view) {
            case 'dashboard': return (
                <div className="space-y-6">
                    {currentUser.role !== 'purchaser' && <LowStockAlerts lowStockItems={lowStockItems} onCreateOrder={handleCreateOrderForLowStock} />}
                    {currentUser.role === 'purchaser' && intentsAwaitingReview.length > 0 && 
                        <PurchaseIntentsTable 
                            title="Intents Awaiting Your Review"
                            intents={intentsAwaitingReview}
                            materials={materials}
                            currentUser={currentUser}
                            onApprove={approvePurchaseIntent}
                            onReject={handleRejectIntentClick}
                            onCreateOrder={handleCreateOrderFromIntent}
                        />
                    }
                    <OrderTable 
                        orders={activeOrders} 
                        vendors={vendors} 
                        materials={materials} 
                        onUpdateOrderStatus={(orderId, status) => updateOrder({ ...orders.find(o => o.id === orderId)!, status })} 
                        onEditOrder={handleEditOrder} 
                        onViewOrder={handleViewOrder}
                        onApproveOrder={approveOrder}
                        onRejectOrder={handleRejectOrderClick}
                        currentUser={currentUser}
                        onConfirmDelivery={handleConfirmDeliveryClick}
                    />
                </div>
            );
            case 'inventory': return <InventoryTable inventory={inventory} onUpdateItem={updateInventoryItem} />;
            case 'order_history': return <OrderHistory orders={orders} vendors={vendors} materials={materials} onBack={() => setView('dashboard')} />;
            case 'issuance_history': return <IssuanceHistory issuances={issuances} materials={materials} sites={sites} onBack={() => setView('dashboard')} />;
            case 'reports': return <Reports orders={orders} vendors={vendors} materials={materials} currentUser={currentUser} inventory={inventory} issuances={issuances} purchaseIntents={purchaseIntents} sites={sites} />;
            case 'intents_all': return <PurchaseIntentsTable title="All Purchase Intents" intents={purchaseIntents} materials={materials} currentUser={currentUser} onCreateOrder={handleCreateOrderFromIntent} />;
            default: return null;
        }
    }

    return (
        <div className="flex">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4 lg:hidden">
                    <h2 className="font-semibold text-lg text-gray-800">Menu</h2>
                     <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Close menu">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="space-y-2">
                    <SideNavItem icon={<Squares2X2Icon className="w-5 h-5 mr-3"/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    
                    {(currentUser.role === 'manager' || currentUser.role === 'inventory_manager') &&
                        <SideNavItem icon={<ClipboardDocumentListIcon className="w-5 h-5 mr-3" />} label="Inventory Status" active={view === 'inventory'} onClick={() => setView('inventory')} />
                    }

                    <SideNavItem icon={<ArchiveBoxIcon className="w-5 h-5 mr-3"/>} label="Order History" active={view === 'order_history'} onClick={() => setView('order_history')} />
                    
                    {currentUser.role !== 'purchaser' &&
                        <SideNavItem icon={<ReceiptRefundIcon className="w-5 h-5 mr-3"/>} label="Issuance History" active={view === 'issuance_history'} onClick={() => setView('issuance_history')} />
                    }
                     {(currentUser.role === 'manager' || currentUser.role === 'purchaser') &&
                        <SideNavItem icon={<ClipboardDocumentCheckIcon className="w-5 h-5 mr-3"/>} label="Purchase Intents" active={view === 'intents_all'} onClick={() => setView('intents_all')} />
                    }
                    <SideNavItem icon={<ChartBarIcon className="w-5 h-5 mr-3"/>} label="Reports" active={view === 'reports'} onClick={() => setView('reports')} />

                    <div className="pt-4 mt-4 border-t">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Actions</h3>
                         {(currentUser.role === 'manager' || currentUser.role === 'purchaser') &&
                            <button onClick={() => { setSelectedOrder(null); setIsNewOrderModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <PlusIcon className="w-5 h-5 mr-3" /> New Purchase Order
                            </button>
                        }
                        {currentUser.role !== 'purchaser' &&
                            <button onClick={() => { setIsIssueModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <ReceiptRefundIcon className="w-5 h-5 mr-3" /> Issue Material
                            </button>
                        }
                         {currentUser.role !== 'manager' &&
                             <button onClick={() => { setIsIntentModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <DocumentPlusIcon className="w-5 h-5 mr-3" /> Raise Purchase Intent
                            </button>
                        }
                    </div>

                    <div className="pt-4 mt-4 border-t">
                         <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Management</h3>
                         <button onClick={() => { setIsVendorModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Manage Vendors</button>
                         <button onClick={() => { setIsMaterialModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Manage Materials</button>
                         <button onClick={() => { setIsSiteModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Manage Sites/Clients</button>
                         <button onClick={() => { setIsStockModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Update Stock Levels</button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 p-4 sm:p-6 bg-gray-50 min-w-0">
                 <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-1 mb-4 text-gray-600 hover:text-gray-900"
                    aria-label="Open sidebar"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
                {renderView()}
            </main>

            {isNewOrderModalOpen && (
                <Modal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} title="New Purchase Order">
                    <NewOrderForm 
                        onAddOrder={addOrder} 
                        onClose={() => setIsNewOrderModalOpen(false)} 
                        currentUser={currentUser.name || 'Unknown'}
                        currentUserRole={currentUser.role}
                        vendors={vendors}
                        materials={materials}
                        sites={sites}
                        initialData={selectedOrder || undefined} // Can be partial from an intent
                    />
                </Modal>
            )}
            
            {isEditOrderModalOpen && selectedOrder && (
                <Modal isOpen={isEditOrderModalOpen} onClose={() => setIsEditOrderModalOpen(false)} title={`Edit Purchase Order: ${selectedOrder.id}`}>
                    <EditOrderForm 
                        order={selectedOrder as PurchaseOrder} 
                        onUpdateOrder={updateOrder} 
                        onClose={() => setIsEditOrderModalOpen(false)}
                        vendors={vendors}
                        materials={materials}
                        sites={sites}
                    />
                </Modal>
            )}
            
            {isDetailsModalOpen && selectedOrder && (
                <OrderDetailsModal 
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    order={selectedOrder as PurchaseOrder}
                    vendors={vendors}
                    materials={materials}
                />
            )}
            
            {isVendorModalOpen && (
                 <VendorManagementModal
                    isOpen={isVendorModalOpen}
                    onClose={() => setIsVendorModalOpen(false)}
                    vendors={vendors}
                    orders={orders}
                    onAddVendor={addVendor}
                    onUpdateVendor={updateVendor}
                    onDeleteVendor={deleteVendor}
                    onBulkAdd={addBulkVendors}
                />
            )}
            
            {isMaterialModalOpen && (
                <MaterialManagementModal
                    isOpen={isMaterialModalOpen}
                    onClose={() => setIsMaterialModalOpen(false)}
                    materials={materials}
                    orders={orders}
                    onAddMaterial={addMaterial}
                    onUpdateMaterial={updateMaterial}
                    onDeleteMaterial={deleteMaterial}
                    onBulkAdd={addBulkMaterials}
                />
            )}

             {isSiteModalOpen && (
                <SiteManagementModal
                    isOpen={isSiteModalOpen}
                    onClose={() => setIsSiteModalOpen(false)}
                    sites={sites}
                    orders={orders}
                    onAddSite={addSite}
                    onUpdateSite={updateSite}
                    onDeleteSite={deleteSite}
                    onBulkAdd={addBulkSites}
                />
            )}

            {isIssueModalOpen && (
                <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Record Material Consumption">
                    <IssueMaterialForm 
                        onIssue={(items) => {
                            items.forEach(item => {
                                issueMaterial(item.materialId, item.quantity, item.unit, item.issuedToSite, item.notes, currentUser.name || '');
                            });
                            setIsIssueModalOpen(false);
                        }}
                        onClose={() => setIsIssueModalOpen(false)}
                        currentUser={currentUser}
                        inventory={inventory}
                        sites={sites}
                    />
                </Modal>
            )}

            {isRejectModalOpen && selectedOrder && (
                <RejectOrderModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onSubmit={handleRejectOrderSubmit}
                />
            )}

             {isIntentModalOpen && (
                <Modal isOpen={isIntentModalOpen} onClose={() => setIsIntentModalOpen(false)} title="Raise a New Purchase Intent">
                    <NewPurchaseIntentForm
                        onAddIntent={addPurchaseIntent}
                        onClose={() => setIsIntentModalOpen(false)}
                        currentUser={currentUser}
                        materials={materials}
                        sites={sites}
                    />
                </Modal>
            )}

            {isIntentRejectModalOpen && selectedIntent && (
                <RejectionModal
                    isOpen={isIntentRejectModalOpen}
                    onClose={() => setIsIntentRejectModalOpen(false)}
                    onSubmit={handleRejectIntentSubmit}
                    title="Reject Purchase Intent"
                />
            )}
            
             {isStockModalOpen && (
                <OpeningStockModal
                    isOpen={isStockModalOpen}
                    onClose={() => setIsStockModalOpen(false)}
                    onSave={setOpeningStock}
                    onBulkSet={addBulkStock}
                    materials={materials}
                    inventory={inventory}
                />
            )}

            {isDeliveryConfirmModalOpen && selectedOrder && (
                 <DeliveryConfirmationModal
                    isOpen={isDeliveryConfirmModalOpen}
                    onClose={() => setIsDeliveryConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelivery}
                    order={selectedOrder as PurchaseOrder}
                    materials={materials}
                    vendors={vendors}
                />
            )}

        </div>
    );
};

export default Dashboard;