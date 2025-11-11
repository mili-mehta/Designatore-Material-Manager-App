import React, { useState, useMemo } from 'react';
import { User, PurchaseOrder, PurchaseIntent, Vendor, Material, Site, InventoryItem } from '../types';
import { useAppContext } from '../context/AppContext';
import InventoryTable from './InventoryTable';
import NewOrderForm from './NewOrderForm';
import EditOrderForm from './EditOrderForm';
import OrderDetailsModal from './OrderDetailsModal';
import Modal from './Modal';
import VendorManagementModal from './VendorManagementModal';
import MaterialManagementModal from './MaterialManagementModal';
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
import DashboardHome from './DashboardHome';
import PurchaseIntentDetailsModal from './PurchaseIntentDetailsModal';
import LowStockAlerts from './LowStockAlerts';

// FIX: Standardized icon import to use './icons' (lowercase) to resolve filename casing conflict.
import { 
    Squares2X2Icon, 
    ArchiveBoxIcon, 
    ClipboardDocumentListIcon, 
    ChartBarIcon,
    BuildingOfficeIcon,
    ReceiptRefundIcon,
    DocumentPlusIcon,
    ClipboardDocumentCheckIcon,
    PlusIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowUpTrayIcon,
    UsersIcon,
    CubeIcon,
    TruckIcon,
    AlertTriangleIcon
} from './icons';


type View = 'dashboard' | 'inventory' | 'low_stock' | 'order_history' | 'reports' | 'issuance_history' | 'intents_all';

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
        addNotification
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
    const [isIntentDetailsModalOpen, setIsIntentDetailsModalOpen] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | Partial<PurchaseOrder> | null>(null);
    const [selectedIntent, setSelectedIntent] = useState<PurchaseIntent | null>(null);

    const lowStockItems = useMemo(() => inventory.filter(i => i.quantity <= i.threshold), [inventory]);

    const handleEditOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsEditOrderModalOpen(true);
    };

    const handleViewOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };
    
    const handleViewIntent = (intent: PurchaseIntent) => {
        setSelectedIntent(intent);
        setIsIntentDetailsModalOpen(true);
    };

    const handleRejectOrderClick = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };

    const handleRejectOrderSubmit = (reason: string) => {
        if (selectedOrder && 'id' in selectedOrder) {
            rejectOrder(selectedOrder.id, reason, currentUser.name || 'Manager');
        }
        setIsRejectModalOpen(false);
        setSelectedOrder(null);
    };

    const handleCreateOrderFromIntent = (intent: PurchaseIntent) => {
        const orderData = convertIntentToOrder(intent.id);
        setSelectedOrder(orderData);
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
                quantity: lowStockItem.threshold * 2,
                unit: material.unit,
                specifications: '',
                rate: 0,
                gst: 18,
            }]
        };
        setSelectedOrder(newPartialOrder);
        setIsNewOrderModalOpen(true);
        addNotification('info', `New order form pre-filled for ${material.name}.`);
    };

    const SideNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
        <li>
            <a href="#" onClick={(e) => { e.preventDefault(); onClick(); setIsSidebarOpen(false); }} className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}>
                {icon}
                <span className="flex-1 ms-3 whitespace-nowrap">{label}</span>
            </a>
        </li>
    );

    const renderView = () => {
        switch(view) {
            case 'dashboard': return (
                <DashboardHome
                    currentUser={currentUser}
                    onEditOrder={handleEditOrder}
                    onViewOrder={handleViewOrder}
                    onApproveOrder={approveOrder}
                    onRejectOrder={handleRejectOrderClick}
                    onConfirmDelivery={handleConfirmDeliveryClick}
                    onViewIntent={handleViewIntent}
                />
            );
            case 'inventory': return <InventoryTable inventory={inventory} onUpdateItem={updateInventoryItem} />;
            case 'low_stock': return <LowStockAlerts lowStockItems={lowStockItems} onCreateOrder={handleCreateOrderForLowStock} />;
            case 'order_history': return <OrderHistory orders={orders} vendors={vendors} materials={materials} onBack={() => setView('dashboard')} />;
            case 'issuance_history': return <IssuanceHistory issuances={issuances} materials={materials} sites={sites} onBack={() => setView('dashboard')} />;
            case 'reports': return <Reports orders={orders} vendors={vendors} materials={materials} currentUser={currentUser} inventory={inventory} issuances={issuances} purchaseIntents={purchaseIntents} sites={sites} />;
            case 'intents_all': return <PurchaseIntentsTable title="All Purchase Intents" intents={purchaseIntents} materials={materials} currentUser={currentUser} onViewIntent={handleViewIntent} />;
            default: return null;
        }
    }

    return (
        <div className="flex">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            
            <aside id="sidebar" className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`}>
                <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
                    <ul className="space-y-2 font-medium">
                        <SideNavItem icon={<Squares2X2Icon className="w-5 h-5 text-gray-500"/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <SideNavItem icon={<ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />} label="Inventory Status" active={view === 'inventory'} onClick={() => setView('inventory')} />
                        <SideNavItem icon={<AlertTriangleIcon className="w-5 h-5 text-gray-500" />} label="Low Stock Alerts" active={view === 'low_stock'} onClick={() => setView('low_stock')} />
                        <SideNavItem icon={<ArchiveBoxIcon className="w-5 h-5 text-gray-500"/>} label="Order History" active={view === 'order_history'} onClick={() => setView('order_history')} />
                        <SideNavItem icon={<ReceiptRefundIcon className="w-5 h-5 text-gray-500"/>} label="Issuance History" active={view === 'issuance_history'} onClick={() => setView('issuance_history')} />
                        <SideNavItem icon={<ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-500"/>} label="Purchase Intents" active={view === 'intents_all'} onClick={() => setView('intents_all')} />
                        <SideNavItem icon={<ChartBarIcon className="w-5 h-5 text-gray-500"/>} label="Reports" active={view === 'reports'} onClick={() => setView('reports')} />
                    </ul>
                    <div className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200">
                        <h3 className="px-2.5 py-1 text-xs font-semibold text-gray-400 uppercase">Actions</h3>
                        {(currentUser.role === 'manager' || currentUser.role === 'purchaser') &&
                            <button onClick={() => { setSelectedOrder(null); setIsNewOrderModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center p-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <PlusIcon className="w-5 h-5 text-gray-500 mr-3" /> New Purchase Order
                            </button>
                        }
                        {currentUser.role !== 'purchaser' &&
                            <button onClick={() => { setIsIssueModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center p-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <TruckIcon className="w-5 h-5 text-gray-500 mr-3" /> Issue Material
                            </button>
                        }
                         {currentUser.role !== 'manager' &&
                             <button onClick={() => { setIsIntentModalOpen(true); setIsSidebarOpen(false); }} className="w-full text-left flex items-center p-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <DocumentPlusIcon className="w-5 h-5 text-gray-500 mr-3" /> Raise Purchase Intent
                            </button>
                        }
                    </div>

                    <div className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200">
                         <h3 className="px-2.5 py-1 text-xs font-semibold text-gray-400 uppercase">Management</h3>
                         <SideNavItem icon={<UsersIcon className="w-5 h-5 text-gray-500" />} label="Manage Vendors" active={false} onClick={() => { setIsVendorModalOpen(true); }} />
                         <SideNavItem icon={<CubeIcon className="w-5 h-5 text-gray-500" />} label="Manage Materials" active={false} onClick={() => { setIsMaterialModalOpen(true); }} />
                         <SideNavItem icon={<BuildingOfficeIcon className="w-5 h-5 text-gray-500" />} label="Manage Sites/Clients" active={false} onClick={() => { setIsSiteModalOpen(true); }} />
                         <SideNavItem icon={<ArrowUpTrayIcon className="w-5 h-5 text-gray-500" />} label="Update Stock Levels" active={false} onClick={() => { setIsStockModalOpen(true); }} />
                    </div>
                </div>
            </aside>

            <main className="lg:ml-64 flex-1 p-4 sm:p-6 bg-gray-100 min-w-0 min-h-screen">
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
                        initialData={selectedOrder || undefined}
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

            {isIntentDetailsModalOpen && selectedIntent && (
                <PurchaseIntentDetailsModal
                    isOpen={isIntentDetailsModalOpen}
                    onClose={() => setIsIntentDetailsModalOpen(false)}
                    intent={selectedIntent}
                    materials={materials}
                    currentUser={currentUser}
                    onApprove={(intentId) => {
                        approvePurchaseIntent(intentId);
                        setIsIntentDetailsModalOpen(false);
                    }}
                    onReject={(intent) => {
                        handleRejectIntentClick(intent);
                        setIsIntentDetailsModalOpen(false);
                    }}
                    onCreateOrder={(intent) => {
                        handleCreateOrderFromIntent(intent);
                        setIsIntentDetailsModalOpen(false);
                    }}
                />
            )}


        </div>
    );
};

export default Dashboard;