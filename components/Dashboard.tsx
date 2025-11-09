import React, { useState, useMemo } from 'react';
import { AppNotification, Material, PurchaseOrder, User, OrderStatus, PurchaseIntent, PurchaseIntentStatus, OrderLineItem } from '../types';
import { useAppContext } from '../context/AppContext';
import InventoryTable from './InventoryTable';
import OrderTable from './OrderTable';
import NewOrderForm from './NewOrderForm';
import EditOrderForm from './EditOrderForm';
import OrderDetailsModal from './OrderDetailsModal';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';
import Modal from './Modal';
import VendorManagementModal from './VendorManagementModal';
import MaterialManagementModal from './MaterialManagementModal';
import SiteManagementModal from './SiteManagementModal';
import OpeningStockModal from './OpeningStockModal';
import OrderHistory from './OrderHistory';
import IssueMaterialForm from './IssueMaterialForm';
import IssuanceHistory from './IssuanceHistory';
import RejectionModal from './RejectionModal';
import NewPurchaseIntentForm from './NewPurchaseIntentForm';
import PurchaseIntentsTable from './PurchaseIntentsTable';
// FIX: Updated icon import path to './Icons' to resolve a filename casing conflict.
import { PlusIcon, AlertTriangleIcon, CheckCircleIcon, InformationCircleIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, Squares2X2Icon, ChartBarIcon, XMarkIcon, BuildingOfficeIcon, ReceiptRefundIcon, ArrowLeftStartOnRectangleIcon, DocumentPlusIcon, ClipboardDocumentCheckIcon } from './Icons';
import Reports from './Reports';
import LowStockAlerts from './LowStockAlerts';


interface DashboardProps {
  currentUser: User;
}

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({ onClick, icon, children }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
        <div className="w-10 h-10 flex items-center justify-center bg-primary-100 text-primary-600 rounded-lg flex-shrink-0">
            {icon}
        </div>
        <div>
            <span className="font-semibold text-gray-800 text-sm">{children}</span>
        </div>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const {
    inventory,
    orders,
    vendors,
    materials,
    sites,
    issuances,
    purchaseIntents,
    isLoading,
    addNotification,
    removeNotification,
    notifications,
    handleAddOrder,
    handleUpdateOrder,
    handleApproveOrder,
    handleConfirmRejectOrder,
    handleUpdateOrderStatus,
    handleIssueMaterial,
    handleAddVendor,
    handleUpdateVendor,
    handleDeleteVendor,
    handleBulkAddVendors,
    handleAddMaterial,
    handleUpdateMaterial,
    handleDeleteMaterial,
    handleBulkAddMaterials,
    handleAddSite,
    handleUpdateSite,
    handleDeleteSite,
    handleBulkAddSites,
    handleAddIntent,
    handleApproveIntent,
    handleConfirmRejectIntent,
    handleCreateOrderFromIntent,
    handleSaveOpeningStock,
    handleBulkSetOpeningStock,
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState<boolean>(false);
  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<PurchaseOrder | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<PurchaseOrder | null>(null);
  const [rejectingIntent, setRejectingIntent] = useState<PurchaseIntent | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [showIssuanceHistory, setShowIssuanceHistory] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  const [orderInitialData, setOrderInitialData] = useState<Partial<PurchaseOrder> | undefined>(undefined);

  const createOrderFromIntent = (intent: PurchaseIntent) => {
    const { initialData, updatedIntent } = handleCreateOrderFromIntent(intent);
    setOrderInitialData(initialData);
    setIsModalOpen(true);
  };
  
  const handleCloseNewOrderModal = () => {
    setIsModalOpen(false);
    setOrderInitialData(undefined);
  };

  const createOrderForLowStock = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const inventoryItem = inventory.find(i => i.id === materialId);
    const suggestedQuantity = inventoryItem ? Math.max(inventoryItem.threshold, inventoryItem.threshold * 2 - inventoryItem.quantity) : 20;

    // FIX: Changed initialLineItem from Partial<OrderLineItem> to OrderLineItem by adding required properties 'id' and 'specifications' to resolve TypeScript error.
    const initialLineItem: OrderLineItem = {
        id: `temp-li-${Date.now()}`,
        materialId: material.id,
        unit: material.unit,
        quantity: suggestedQuantity,
        specifications: '', // required property
        rate: 0,
        gst: 18,
    };
    setOrderInitialData({ lineItems: [initialLineItem] });
    setIsModalOpen(true);
  };
  
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => {
        if (item.quantity > item.threshold) return false;
        return !orders.some(order => 
            (order.status === OrderStatus.Pending || order.status === OrderStatus.AwaitingApproval) && 
            order.lineItems.some(li => li.materialId === item.id)
        );
    });
  }, [inventory, orders]);

  // --- UI STATE & RENDER LOGIC ---
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div>
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
    </div>;
  }
  
  const activeView = showHistory ? 'history' : showReports ? 'reports' : showIssuanceHistory ? 'issuanceHistory' : showInventory ? 'inventory' : showLowStock ? 'lowStock' : 'dashboard';

  const notificationConfig = {
    warning: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', icon: <AlertTriangleIcon className="w-5 h-5 mr-3" /> },
    info: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', icon: <InformationCircleIcon className="w-5 h-5 mr-3" /> },
    success: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', icon: <CheckCircleIcon className="w-5 h-5 mr-3" /> },
  };

  const ordersAwaitingApproval = currentUser.role === 'manager' ? orders.filter(o => o.status === OrderStatus.AwaitingApproval) : [];
  const mainOrderList = orders.filter(o => {
      if (currentUser.role === 'manager') return o.status === OrderStatus.Pending;
      if (currentUser.role === 'purchaser') return o.status === OrderStatus.Pending || (o.status === OrderStatus.AwaitingApproval && o.raisedBy === currentUser.name);
      if (currentUser.role === 'inventory_manager') return o.status === OrderStatus.Pending;
      return false;
  });

  const intentsForReview = currentUser.role === 'purchaser' ? purchaseIntents.filter(i => i.status === PurchaseIntentStatus.Pending) : [];
  const intentsApproved = currentUser.role === 'purchaser' ? purchaseIntents.filter(i => i.status === PurchaseIntentStatus.Approved) : [];
  const myIntents = currentUser.role === 'inventory_manager' ? purchaseIntents.filter(i => i.requestedBy === currentUser.name) : [];

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {activeView === 'history' && 'Order History'}
                {activeView === 'reports' && 'Reports'}
                {activeView === 'issuanceHistory' && 'Issuance History'}
                {activeView === 'inventory' && 'Inventory Status'}
                {activeView === 'lowStock' && 'Low Stock Alerts'}
                {activeView === 'dashboard' && 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                 {activeView !== 'dashboard' ? (
                    <button
                        onClick={() => { setShowHistory(false); setShowReports(false); setShowIssuanceHistory(false); setShowInventory(false); setShowLowStock(false); }}
                        className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium transition text-sm"
                    >
                        Back to Dashboard
                    </button>
                 ) : (
                    <>
                        <button
                            onClick={() => setShowInventory(true)}
                            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium transition text-sm flex items-center gap-2"
                        >
                            <ClipboardDocumentCheckIcon className="w-4 h-4" />
                            View Inventory Status
                        </button>
                        {lowStockItems.length > 0 && currentUser.role !== 'inventory_manager' && (
                            <button
                                onClick={() => setShowLowStock(true)}
                                className="relative px-4 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md text-amber-800 font-medium transition text-sm flex items-center gap-2"
                            >
                                <AlertTriangleIcon className="w-4 h-4" />
                                Low Stock Alerts
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                    {lowStockItems.length}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium transition text-sm flex items-center gap-2"
                        >
                            <ArchiveBoxIcon className="w-4 h-4" />
                            Order History
                        </button>
                         <button
                            onClick={() => setShowIssuanceHistory(true)}
                            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium transition text-sm flex items-center gap-2"
                        >
                            <ReceiptRefundIcon className="w-4 h-4" />
                            Issuance History
                        </button>
                        <button
                            onClick={() => setShowReports(true)}
                            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-800 font-medium transition text-sm flex items-center gap-2"
                        >
                            <ChartBarIcon className="w-4 h-4" />
                            Reports
                        </button>
                        {currentUser.role === 'inventory_manager' &&
                          <button
                            onClick={() => setIsIntentModalOpen(true)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition text-sm shadow-sm flex items-center gap-2"
                          >
                            <DocumentPlusIcon className="w-4 h-4" />
                            Raise Purchase Intent
                          </button>
                        }
                    </>
                 )}
            </div>
        </div>
       
        {/* --- Main Content Area --- */}
        {activeView === 'dashboard' && (
            <div className="space-y-8">
                
                {/* Management & Action Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Management Panel for Manager/Purchaser */}
                    {(currentUser.role === 'manager' || currentUser.role === 'purchaser') && (
                        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Actions & Management</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ActionButton onClick={() => setIsModalOpen(true)} icon={<DocumentPlusIcon className="w-5 h-5" />}>
                                    Create Purchase Order
                                </ActionButton>
                                <ActionButton onClick={() => setIsMaterialModalOpen(true)} icon={<Squares2X2Icon className="w-5 h-5" />}>
                                    Manage Materials
                                </ActionButton>
                                <ActionButton onClick={() => setIsVendorModalOpen(true)} icon={<BuildingOfficeIcon className="w-5 h-5" />}>
                                    Manage Vendors
                                </ActionButton>
                                <ActionButton onClick={() => setIsSiteModalOpen(true)} icon={<ClipboardDocumentListIcon className="w-5 h-5" />}>
                                    Manage Sites
                                </ActionButton>
                                <ActionButton onClick={() => setIsOpeningStockModalOpen(true)} icon={<ArrowLeftStartOnRectangleIcon className="w-5 h-5" />}>
                                    Set Opening Stock
                                </ActionButton>
                            </div>
                        </div>
                    )}

                    {/* Inventory Actions for Inventory Manager */}
                    {currentUser.role === 'inventory_manager' && (
                        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Management & Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* FIX: Replaced incomplete/empty ActionButton with full implementation for inventory manager actions. */}
                                <ActionButton onClick={() => setIsIssueModalOpen(true)} icon={<ReceiptRefundIcon className="w-5 h-5" />}>
                                    Record Material Consumption
                                </ActionButton>
                                <ActionButton onClick={() => setIsIntentModalOpen(true)} icon={<DocumentPlusIcon className="w-5 h-5" />}>
                                    Raise Purchase Intent
                                </ActionButton>
                            </div>
                        </div>
                    )}
                </div>

                {/* Approvals for Manager */}
                {currentUser.role === 'manager' && ordersAwaitingApproval.length > 0 && (
                    <OrderTable
                        orders={ordersAwaitingApproval}
                        vendors={vendors}
                        materials={materials}
                        onUpdateOrderStatus={(orderId, status) => handleUpdateOrderStatus(currentUser, orderId, status)}
                        onEditOrder={setEditingOrder}
                        onViewOrder={setViewingOrder}
                        onConfirmDelivery={(order) => setConfirmingDelivery(order)}
                        onApproveOrder={(orderId) => handleApproveOrder(orderId, currentUser)}
                        onRejectOrder={setRejectingOrder}
                        currentUser={currentUser}
                    />
                )}

                {/* Intents for Purchaser */}
                {currentUser.role === 'purchaser' && (
                    <div className="space-y-8">
                        {intentsForReview.length > 0 && (
                            <PurchaseIntentsTable
                                title="Intents Awaiting Review"
                                intents={intentsForReview}
                                materials={materials}
                                currentUser={currentUser}
                                onApprove={(intentId) => handleApproveIntent(intentId, currentUser)}
                                onReject={setRejectingIntent}
                            />
                        )}
                        {intentsApproved.length > 0 && (
                             <PurchaseIntentsTable
                                title="Approved Intents - Ready for PO"
                                intents={intentsApproved}
                                materials={materials}
                                currentUser={currentUser}
                                onCreateOrder={createOrderFromIntent}
                            />
                        )}
                    </div>
                )}
                
                {/* Intents for Inventory Manager */}
                {currentUser.role === 'inventory_manager' && myIntents.length > 0 && (
                     <PurchaseIntentsTable
                        title="My Purchase Intents"
                        intents={myIntents}
                        materials={materials}
                        currentUser={currentUser}
                    />
                )}
                
                {/* Main Order Table */}
                <OrderTable
                    orders={mainOrderList}
                    vendors={vendors}
                    materials={materials}
                    onUpdateOrderStatus={(orderId, status) => handleUpdateOrderStatus(currentUser, orderId, status)}
                    onEditOrder={setEditingOrder}
                    onViewOrder={setViewingOrder}
                    onConfirmDelivery={(order) => setConfirmingDelivery(order)}
                    onApproveOrder={(orderId) => handleApproveOrder(orderId, currentUser)}
                    onRejectOrder={setRejectingOrder}
                    currentUser={currentUser}
                />
            </div>
        )}

        {/* --- Other Full-screen Views --- */}
        {activeView === 'history' && <OrderHistory orders={orders} vendors={vendors} materials={materials} onBack={() => setShowHistory(false)} />}
        {activeView === 'reports' && <Reports orders={orders} vendors={vendors} materials={materials} currentUser={currentUser} inventory={inventory} issuances={issuances} sites={sites} purchaseIntents={purchaseIntents} />}
        {activeView === 'issuanceHistory' && <IssuanceHistory issuances={issuances} materials={materials} sites={sites} onBack={() => setShowIssuanceHistory(false)} />}
        {activeView === 'inventory' && <InventoryTable inventory={inventory} />}
        {activeView === 'lowStock' && <LowStockAlerts lowStockItems={lowStockItems} onCreateOrder={createOrderForLowStock} />}

        {/* --- Modals --- */}
        <Modal isOpen={isModalOpen || !!editingOrder} onClose={() => { setIsModalOpen(false); setEditingOrder(null); setOrderInitialData(undefined); }} title={editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}>
          {editingOrder ? (
            <EditOrderForm
              order={editingOrder}
              onUpdateOrder={(updatedOrder) => { handleUpdateOrder(updatedOrder); setEditingOrder(null); }}
              onClose={() => setEditingOrder(null)}
              vendors={vendors}
              materials={materials}
              sites={sites}
            />
          ) : (
            <NewOrderForm
              onAddOrder={handleAddOrder}
              onClose={handleCloseNewOrderModal}
              currentUser={currentUser.name || 'Unknown'}
              currentUserRole={currentUser.role}
              vendors={vendors}
              materials={materials}
              sites={sites}
              initialData={orderInitialData}
            />
          )}
        </Modal>

        {viewingOrder && (
            <OrderDetailsModal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} order={viewingOrder} vendors={vendors} materials={materials} />
        )}

        {confirmingDelivery && (
            <DeliveryConfirmationModal 
                isOpen={!!confirmingDelivery} 
                onClose={() => setConfirmingDelivery(null)}
                onConfirm={() => { handleUpdateOrderStatus(currentUser, confirmingDelivery.id, OrderStatus.Delivered); setConfirmingDelivery(null); }}
                order={confirmingDelivery}
                materials={materials}
                vendors={vendors}
            />
        )}
        
        {rejectingOrder && (
            <RejectionModal 
                isOpen={!!rejectingOrder}
                onClose={() => setRejectingOrder(null)}
                onSubmit={(reason) => { handleConfirmRejectOrder(currentUser, rejectingOrder, reason); setRejectingOrder(null); }}
                title="Reject Purchase Order"
            />
        )}

        {rejectingIntent && (
             <RejectionModal 
                isOpen={!!rejectingIntent}
                onClose={() => setRejectingIntent(null)}
                onSubmit={(reason) => { handleConfirmRejectIntent(currentUser, rejectingIntent, reason); setRejectingIntent(null); }}
                title="Reject Purchase Intent"
            />
        )}

        <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Record Material Consumption">
            <IssueMaterialForm 
                onIssue={(...args) => { handleIssueMaterial(currentUser, ...args); setIsIssueModalOpen(false); }}
                onClose={() => setIsIssueModalOpen(false)}
                currentUser={currentUser}
                inventory={inventory}
                materials={materials}
                sites={sites}
            />
        </Modal>

        <Modal isOpen={isIntentModalOpen} onClose={() => setIsIntentModalOpen(false)} title="Raise Purchase Intent">
            <NewPurchaseIntentForm
                onAddIntent={(intent) => { handleAddIntent(currentUser, intent); setIsIntentModalOpen(false); }}
                onClose={() => setIsIntentModalOpen(false)}
                currentUser={currentUser}
                materials={materials}
                sites={sites}
            />
        </Modal>

        <VendorManagementModal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} vendors={vendors} orders={orders} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} onBulkAdd={handleBulkAddVendors} />
        <MaterialManagementModal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} materials={materials} orders={orders} onAddMaterial={handleAddMaterial} onUpdateMaterial={handleUpdateMaterial} onDeleteMaterial={handleDeleteMaterial} onBulkAdd={handleBulkAddMaterials} />
        <SiteManagementModal isOpen={isSiteModalOpen} onClose={() => setIsSiteModalOpen(false)} sites={sites} orders={orders} onAddSite={handleAddSite} onUpdateSite={handleUpdateSite} onDeleteSite={handleDeleteSite} onBulkAdd={handleBulkAddSites} />
        <OpeningStockModal isOpen={isOpeningStockModalOpen} onClose={() => setIsOpeningStockModalOpen(false)} materials={materials} inventory={inventory} onSave={(payload) => { handleSaveOpeningStock(payload); setIsOpeningStockModalOpen(false); }} onBulkSet={(data) => { handleBulkSetOpeningStock(data); setIsOpeningStockModalOpen(false); }} />

    </main>
  );
};

export default Dashboard;
