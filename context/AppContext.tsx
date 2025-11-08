import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AppNotification, InventoryItem, PurchaseOrder, User, OrderStatus, Vendor, Material, Site, MaterialIssuance, PurchaseIntent, OrderLineItem, PurchaseIntentStatus, PurchaseIntentLineItem } from '../types';
import { supabase } from '../services/supabase';


// Define the shape of the context state
interface AppContextState {
    inventory: InventoryItem[];
    orders: PurchaseOrder[];
    vendors: Vendor[];
    materials: Material[];
    sites: Site[];
    issuances: MaterialIssuance[];
    purchaseIntents: PurchaseIntent[];
    isLoading: boolean;
    notifications: AppNotification[];
    addNotification: (type: AppNotification['type'], message: string) => void;
    removeNotification: (id: number) => void;
    handleAddOrder: (order: Omit<PurchaseOrder, 'id'>) => void;
    handleUpdateOrder: (updatedOrder: PurchaseOrder) => void;
    handleApproveOrder: (orderId: string, currentUser: User) => void;
    handleConfirmRejectOrder: (currentUser: User, rejectingOrder: PurchaseOrder, reason: string) => void;
    handleUpdateOrderStatus: (currentUser: User, orderId: string, status: OrderStatus) => void;
    handleIssueMaterial: (currentUser: User, materialId: string, quantity: number, unit: string, issuedToSite: string, notes?: string) => void;
    handleAddVendor: (name: string) => void;
    handleUpdateVendor: (vendor: Vendor) => void;
    handleDeleteVendor: (vendorId: string) => void;
    handleBulkAddVendors: (data: { name: string }[]) => void;
    handleAddMaterial: (name: string, unit: string) => void;
    handleUpdateMaterial: (mat: Material) => void;
    handleDeleteMaterial: (materialId: string) => void;
    handleBulkAddMaterials: (data: { name: string, unit: string }[]) => void;
    handleAddSite: (name: string) => void;
    handleUpdateSite: (site: Site) => void;
    handleDeleteSite: (siteId: string) => void;
    handleBulkAddSites: (data: { name: string }[]) => void;
    handleAddIntent: (currentUser: User, intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status' | 'requestedBy'>) => void;
    handleApproveIntent: (intentId: string, currentUser: User) => void;
    handleConfirmRejectIntent: (currentUser: User, rejectingIntent: PurchaseIntent, reason: string) => void;
    handleCreateOrderFromIntent: (intent: PurchaseIntent) => { initialData: Partial<PurchaseOrder>, updatedIntent: PurchaseIntent };
    handleSaveOpeningStock: (payload: { updatedStocks: { materialId: string, quantity: number }[], newItems: { name: string, unit: string, quantity: number }[] }) => void;
    handleBulkSetOpeningStock: (data: { name: string, unit: string, quantity: number, threshold: number }[]) => void;
}

// Create the context
const AppContext = createContext<AppContextState | undefined>(undefined);

// Helper to convert snake_case keys from Supabase to camelCase
const toCamelCase = (obj: any) => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/_([a-z])/g, g => g[1].toUpperCase())]: toCamelCase(obj[key]),
            }),
            {},
        );
    }
    return obj;
};

// Helper to convert camelCase keys to snake_case for Supabase
const toSnakeCase = (obj: any) => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: toSnakeCase(obj[key]),
            }),
            {},
        );
    }
    return obj;
};

// Create the provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [issuances, setIssuances] = useState<MaterialIssuance[]>([]);
    const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                materialsRes,
                vendorsRes,
                sitesRes,
                inventoryRes,
                ordersRes,
                lineItemsRes,
                intentsRes,
                intentLineItemsRes,
                issuancesRes
            ] = await Promise.all([
                supabase.from('materials').select('*'),
                supabase.from('vendors').select('*'),
                supabase.from('sites').select('*'),
                supabase.from('inventory').select('*'),
                supabase.from('purchase_orders').select('*'),
                supabase.from('order_line_items').select('*'),
                supabase.from('purchase_intents').select('*'),
                supabase.from('purchase_intent_line_items').select('*'),
                supabase.from('material_issuances').select('*'),
            ]);

            // Process Materials, Vendors, Sites
            const loadedMaterials: Material[] = toCamelCase(materialsRes.data || []);
            setMaterials(loadedMaterials);
            setVendors(toCamelCase(vendorsRes.data || []));
            setSites(toCamelCase(sitesRes.data || []));

            // Process Inventory
            const loadedInventoryItems: {materialId: string, quantity: number, threshold: number}[] = toCamelCase(inventoryRes.data || []);
            const combinedInventory = loadedInventoryItems.map(invItem => {
                const material = loadedMaterials.find(m => m.id === invItem.materialId);
                return {
                    ...material,
                    ...invItem,
                    id: invItem.materialId,
                } as InventoryItem;
            }).filter(item => item.name); // Filter out items where material might be missing
            setInventory(combinedInventory);

            // Process Orders and Line Items
            const loadedOrders: PurchaseOrder[] = toCamelCase(ordersRes.data || []);
            const loadedLineItems: OrderLineItem[] = toCamelCase(lineItemsRes.data || []);
            const combinedOrders = loadedOrders.map(order => ({
                ...order,
                lineItems: loadedLineItems.filter(li => li.orderId === order.id)
            }));
            setOrders(combinedOrders);
            
            // Process Intents and Line Items
            const loadedIntents: PurchaseIntent[] = toCamelCase(intentsRes.data || []);
            const loadedIntentLineItems: PurchaseIntentLineItem[] = toCamelCase(intentLineItemsRes.data || []);
            const combinedIntents = loadedIntents.map(intent => ({
                ...intent,
                lineItems: loadedIntentLineItems.filter(li => li.intentId === intent.id)
            }));
            setPurchaseIntents(combinedIntents);

            // Process Issuances
            setIssuances(toCamelCase(issuancesRes.data || []));

        } catch (error) {
            console.error("Error loading data from Supabase:", error);
            addNotification('warning', 'Failed to load data from the server.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


    // --- NOTIFICATION HANDLERS ---
    const addNotification = (type: AppNotification['type'], message: string) => {
        setNotifications(prev => {
            if (prev.some(n => n.message === message)) return prev;
            const newNotification = { id: Date.now(), type, message };
            const timeout = type === 'warning' ? 10000 : 5000;
            setTimeout(() => removeNotification(newNotification.id), timeout); 
            return [...prev, newNotification];
        });
    };
    const removeNotification = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));
    
    // --- DATA HANDLER FUNCTIONS (SUPABASE) ---

    const handleAddOrder = async (order: Omit<PurchaseOrder, 'id'>) => {
        const orderId = `PO-${Date.now()}`;
        const { lineItems, ...orderData } = order;

        const { error: orderError } = await supabase
            .from('purchase_orders')
            .insert([toSnakeCase({ ...orderData, id: orderId })]);
        
        if (orderError) {
            addNotification('warning', 'Failed to create purchase order.');
            console.error(orderError);
            return;
        }

        const lineItemsWithOrderId = lineItems.map(li => ({ ...li, orderId: orderId, id: `LI-${crypto.randomUUID()}` }));
        const { error: lineItemsError } = await supabase
            .from('order_line_items')
            .insert(toSnakeCase(lineItemsWithOrderId));

        if (lineItemsError) {
            addNotification('warning', 'Failed to save order items.');
            console.error(lineItemsError);
             // Attempt to roll back
            await supabase.from('purchase_orders').delete().eq('id', orderId);
            return;
        }

        addNotification('success', 'Purchase Order created successfully.');
        loadData();
    };
    
    const handleUpdateOrder = async (updatedOrder: PurchaseOrder) => {
        const { lineItems, ...orderData } = updatedOrder;
        
        const { error: orderError } = await supabase
            .from('purchase_orders')
            .update(toSnakeCase(orderData))
            .eq('id', updatedOrder.id);
            
        if(orderError) {
            addNotification('warning', 'Failed to update order.');
            console.error(orderError);
            return;
        }
        
        // Easiest way to handle line item changes is to delete and re-insert
        await supabase.from('order_line_items').delete().eq('order_id', updatedOrder.id);
        const lineItemsWithOrderId = lineItems.map(li => ({ ...li, orderId: updatedOrder.id, id: li.id || `LI-${crypto.randomUUID()}` }));
        await supabase.from('order_line_items').insert(toSnakeCase(lineItemsWithOrderId));

        addNotification('success', `Order has been successfully updated.`);
        loadData();
    };

    const handleApproveOrder = async (orderId: string, currentUser: User) => {
        const { error } = await supabase
            .from('purchase_orders')
            .update({ 
                status: OrderStatus.Pending,
                approved_by: currentUser.name,
                approved_on: new Date().toISOString().split('T')[0]
            })
            .eq('id', orderId);
        
        if (error) {
            addNotification('warning', 'Failed to approve order.');
        } else {
            addNotification('success', `Order has been approved.`);
            loadData();
        }
    };

    const handleConfirmRejectOrder = async (currentUser: User, rejectingOrder: PurchaseOrder, reason: string) => {
         const { error } = await supabase
            .from('purchase_orders')
            .update({ 
                status: OrderStatus.Cancelled,
                rejected_by: currentUser.name,
                rejected_on: new Date().toISOString().split('T')[0],
                rejection_reason: reason
            })
            .eq('id', rejectingOrder.id);
        
         if (error) {
            addNotification('warning', 'Failed to reject order.');
        } else {
            addNotification('info', `Order has been rejected.`);
            loadData();
        }
    };

    const handleUpdateOrderStatus = async (currentUser: User, orderId: string, status: OrderStatus) => {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (!orderToUpdate) return;
        
        let updatePayload: any = { status };
        if (status === OrderStatus.Delivered) {
            updatePayload.delivered_on = new Date().toISOString().split('T')[0];
            updatePayload.received_by = currentUser.name;

            // Update inventory transaction
            for (const item of orderToUpdate.lineItems) {
                // Supabase doesn't have an increment function without an RPC call, so we fetch and update
                const { data: currentItem } = await supabase.from('inventory').select('quantity').eq('material_id', item.materialId).single();
                if(currentItem) {
                    await supabase.from('inventory').update({ quantity: currentItem.quantity + item.quantity }).eq('material_id', item.materialId);
                }
            }
        }
        
        const { error } = await supabase.from('purchase_orders').update(updatePayload).eq('id', orderId);
        if(error) {
            addNotification('warning', 'Failed to update order status.');
            return;
        }

        addNotification('success', `Order status updated to ${status}.`);
        loadData();
    };

    const handleIssueMaterial = async (currentUser: User, materialId: string, quantity: number, unit: string, issuedToSite: string, notes?: string) => {
        const newIssuance = { id: `ISS-${Date.now()}`, materialId, quantity, unit, issuedToSite, notes, issuedBy: currentUser.name || 'Unknown', issuedOn: new Date().toISOString().split('T')[0] };
        
        const { data: currentItem } = await supabase.from('inventory').select('quantity').eq('material_id', materialId).single();
        if(!currentItem || currentItem.quantity < quantity) {
            addNotification('warning', 'Insufficient stock.');
            return;
        }
        
        const { error } = await supabase.from('material_issuances').insert(toSnakeCase([newIssuance]));
        if(error) {
            addNotification('warning', 'Failed to record issuance.');
            return;
        }

        await supabase.from('inventory').update({ quantity: currentItem.quantity - quantity }).eq('material_id', materialId);
        
        addNotification('success', 'Material issued successfully.');
        loadData();
    };

    const handleAddVendor = async (name: string) => {
        const newVendor = { id: `V-${crypto.randomUUID()}`, name };
        await supabase.from('vendors').insert(toSnakeCase([newVendor]));
        addNotification('success', 'Vendor added successfully.');
        loadData();
    };
    
    const handleUpdateVendor = async (vendor: Vendor) => {
        await supabase.from('vendors').update(toSnakeCase(vendor)).eq('id', vendor.id);
        addNotification('success', 'Vendor updated successfully.');
        loadData();
    };
    
    const handleDeleteVendor = async (vendorId: string) => {
        await supabase.from('vendors').delete().eq('id', vendorId);
        addNotification('success', 'Vendor deleted successfully.');
        loadData();
    };

    const handleBulkAddVendors = async (data: { name: string }[]) => {
        const existingNames = new Set(vendors.map(v => v.name.toLowerCase()));
        const seenInUpload = new Set<string>();

        const newVendors = data
            .filter(v => {
                if (!v.name || !v.name.trim()) return false;
                const lowerCaseName = v.name.trim().toLowerCase();
                if (existingNames.has(lowerCaseName) || seenInUpload.has(lowerCaseName)) {
                    return false;
                }
                seenInUpload.add(lowerCaseName);
                return true;
            })
            .map(v => ({ id: `V-${crypto.randomUUID()}`, name: v.name.trim() }));

        if (newVendors.length === 0) {
            addNotification('info', 'No new vendors to add. All names already exist or are empty.');
            return;
        }

        const { error } = await supabase.from('vendors').insert(toSnakeCase(newVendors));
        if (error) {
            addNotification('warning', 'Failed to bulk add vendors.');
            console.error(error);
        } else {
            addNotification('success', `${newVendors.length} vendors added successfully.`);
            loadData();
        }
    };
    
    const handleAddMaterial = async (name: string, unit: string) => {
        const newMaterial = { id: `M-${crypto.randomUUID()}`, name, unit };
        const newInventoryItem = { materialId: newMaterial.id, quantity: 0, threshold: 10 };

        await supabase.from('materials').insert(toSnakeCase([newMaterial]));
        await supabase.from('inventory').insert(toSnakeCase([newInventoryItem]));
        
        addNotification('success', `Material added successfully.`);
        loadData();
    };
    
    const handleUpdateMaterial = async (mat: Material) => {
        await supabase.from('materials').update(toSnakeCase(mat)).eq('id', mat.id);
        addNotification('success', 'Material updated successfully.');
        loadData();
    };
    
    const handleDeleteMaterial = async (materialId: string) => {
        await supabase.from('inventory').delete().eq('material_id', materialId);
        await supabase.from('materials').delete().eq('id', materialId);
        addNotification('success', 'Material deleted successfully.');
        loadData();
    };

    const handleBulkAddMaterials = async (data: { name: string, unit: string }[]) => {
        const existingNames = new Set(materials.map(m => m.name.toLowerCase()));
        const seenInUpload = new Set<string>();

        const newMaterials = data
            .filter(m => {
                if (!m.name || !m.name.trim() || !m.unit) return false;
                const lowerCaseName = m.name.trim().toLowerCase();
                if (existingNames.has(lowerCaseName) || seenInUpload.has(lowerCaseName)) {
                    return false;
                }
                seenInUpload.add(lowerCaseName);
                return true;
            })
            .map(m => ({ id: `M-${crypto.randomUUID()}`, name: m.name.trim(), unit: m.unit }));
        
        if (newMaterials.length === 0) {
            addNotification('info', 'No new materials to add. All names already exist or data is incomplete.');
            return;
        }

        const newInventoryItems = newMaterials.map(m => ({ materialId: m.id, quantity: 0, threshold: 10 }));

        const { error: matError } = await supabase.from('materials').insert(toSnakeCase(newMaterials));
        if (matError) {
            addNotification('warning', 'Failed to bulk add materials.');
            console.error(matError);
            return;
        }
        await supabase.from('inventory').insert(toSnakeCase(newInventoryItems));

        addNotification('success', `${newMaterials.length} materials added successfully.`);
        loadData();
    };

    const handleAddSite = async (name: string) => {
        const newSite = { id: `S-${crypto.randomUUID()}`, name };
        await supabase.from('sites').insert(toSnakeCase([newSite]));
        addNotification('success', 'Site/Client added successfully.');
        loadData();
    };
    
    const handleUpdateSite = async (site: Site) => {
        await supabase.from('sites').update(toSnakeCase(site)).eq('id', site.id);
        addNotification('success', 'Site/Client updated successfully.');
        loadData();
    };
    
    const handleDeleteSite = async (siteId: string) => {
        await supabase.from('sites').delete().eq('id', siteId);
        addNotification('success', 'Site/Client deleted successfully.');
        loadData();
    };

    const handleBulkAddSites = async (data: { name: string }[]) => {
        const existingNames = new Set(sites.map(s => s.name.toLowerCase()));
        const seenInUpload = new Set<string>();

        const newSites = data
            .filter(s => {
                if (!s.name || !s.name.trim()) return false;
                const lowerCaseName = s.name.trim().toLowerCase();
                if (existingNames.has(lowerCaseName) || seenInUpload.has(lowerCaseName)) {
                    return false;
                }
                seenInUpload.add(lowerCaseName);
                return true;
            })
            .map(s => ({ id: `S-${crypto.randomUUID()}`, name: s.name.trim() }));
        
        if (newSites.length === 0) {
            addNotification('info', 'No new sites to add. All names already exist or are empty.');
            return;
        }

        const { error } = await supabase.from('sites').insert(toSnakeCase(newSites));
        if (error) {
            addNotification('warning', 'Failed to bulk add sites.');
            console.error(error);
        } else {
            addNotification('success', `${newSites.length} sites added successfully.`);
            loadData();
        }
    };
    
    const handleAddIntent = async (currentUser: User, intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status' | 'requestedBy'>) => {
        const intentId = `PI-${Date.now()}`;
        const { lineItems, ...intentData } = intent;
        const newIntent = { ...intentData, id: intentId, requestedOn: new Date().toISOString().split('T')[0], status: PurchaseIntentStatus.Pending, requestedBy: currentUser.name || 'Unknown' };

        await supabase.from('purchase_intents').insert(toSnakeCase([newIntent]));
        const lineItemsWithIntentId = lineItems.map(li => ({ ...li, intentId, id: `INTLI-${crypto.randomUUID()}` }));
        await supabase.from('purchase_intent_line_items').insert(toSnakeCase(lineItemsWithIntentId));
        
        addNotification('success', 'Purchase intent submitted successfully.');
        loadData();
    };
    
    const handleApproveIntent = async (intentId: string, currentUser: User) => {
        await supabase.from('purchase_intents').update({ status: PurchaseIntentStatus.Approved, reviewed_by: currentUser.name, reviewed_on: new Date().toISOString().split('T')[0] }).eq('id', intentId);
        addNotification('success', 'Intent approved.');
        loadData();
    };
    
    const handleConfirmRejectIntent = async (currentUser: User, rejectingIntent: PurchaseIntent, reason: string) => {
        await supabase.from('purchase_intents').update({ status: PurchaseIntentStatus.Rejected, rejection_reason: reason, reviewed_by: currentUser.name, reviewed_on: new Date().toISOString().split('T')[0] }).eq('id', rejectingIntent.id);
        addNotification('info', 'Intent rejected.');
        loadData();
    };
      
    const handleCreateOrderFromIntent = (intent: PurchaseIntent) => {
        // This remains a client-side operation until the order is actually submitted
        const updatedIntent = { ...intent, status: PurchaseIntentStatus.Converted };
        handleUpdateIntentStatus(updatedIntent); // Update the intent status in DB
        
        const initialLineItems: OrderLineItem[] = intent.lineItems.map(item => ({ id: `temp-LI-${item.id}`, materialId: item.materialId, quantity: item.quantity, unit: item.unit, site: item.site, specifications: `From Intent #${intent.id.substring(0, 6)}. ${item.notes || ''}`.trim(), rate: 0, gst: 18, brand: '', discount: 0, freight: 0, size: '' }));
        return { initialData: { lineItems: initialLineItems, notes: intent.notes, intentId: intent.id }, updatedIntent };
    };
    
    const handleUpdateIntentStatus = async (intent: PurchaseIntent) => {
        await supabase.from('purchase_intents').update({ status: intent.status }).eq('id', intent.id);
        loadData();
    };
    
    const handleSaveOpeningStock = async ({ updatedStocks, newItems }: { updatedStocks: { materialId: string, quantity: number }[], newItems: { name: string, unit: string, quantity: number }[] }) => {
        
        if (newItems.length > 0) {
            const materialsToAdd = newItems.map(item => ({ id: `M-${crypto.randomUUID()}`, name: item.name, unit: item.unit }));
            const inventoryToAdd = materialsToAdd.map((mat, i) => ({ material_id: mat.id, quantity: newItems[i].quantity, threshold: 10 }));
            await supabase.from('materials').insert(toSnakeCase(materialsToAdd));
            await supabase.from('inventory').insert(inventoryToAdd);
        }
        
        if(updatedStocks.length > 0) {
            const updates = updatedStocks.map(stock => 
                supabase.from('inventory').update({ quantity: stock.quantity }).eq('material_id', stock.materialId)
            );
            await Promise.all(updates);
        }
        
        addNotification('success', 'Stock levels updated successfully.');
        loadData();
    };

    const handleBulkSetOpeningStock = async (data: { name: string, unit: string, quantity: number, threshold: number }[]) => {
        const materialsMap = new Map(materials.map(m => [m.name.toLowerCase(), m.id]));
        const materialsToCreate: any[] = [];
        const inventoryToUpsert: any[] = [];

        for (const item of data) {
            if (!item.name || isNaN(Number(item.quantity)) || isNaN(Number(item.threshold))) continue;

            const existingId = materialsMap.get(item.name.toLowerCase());
            if (existingId) {
                inventoryToUpsert.push({ material_id: existingId, quantity: item.quantity, threshold: item.threshold });
            } else {
                const newId = `M-${crypto.randomUUID()}`;
                materialsToCreate.push({ id: newId, name: item.name, unit: item.unit || 'units' });
                inventoryToUpsert.push({ material_id: newId, quantity: item.quantity, threshold: item.threshold });
            }
        }
        
        if (materialsToCreate.length > 0) {
            await supabase.from('materials').insert(toSnakeCase(materialsToCreate));
        }

        if (inventoryToUpsert.length > 0) {
            const { error } = await supabase.from('inventory').upsert(inventoryToUpsert, { onConflict: 'material_id' });
            if(error) {
                addNotification('warning', 'Error updating some stock levels.');
                console.error(error);
            }
        }
        
        addNotification('success', 'Bulk stock update processed.');
        loadData();
    };

    const contextValue = useMemo(() => ({
        inventory, orders, vendors, materials, sites, issuances, purchaseIntents, isLoading, notifications, addNotification, removeNotification, handleAddOrder, handleUpdateOrder, handleApproveOrder, handleConfirmRejectOrder, handleUpdateOrderStatus, handleIssueMaterial, handleAddVendor, handleUpdateVendor, handleDeleteVendor, handleBulkAddVendors, handleAddMaterial, handleUpdateMaterial, handleDeleteMaterial, handleBulkAddMaterials, handleAddSite, handleUpdateSite, handleDeleteSite, handleBulkAddSites, handleAddIntent, handleApproveIntent, handleConfirmRejectIntent, handleCreateOrderFromIntent, handleSaveOpeningStock, handleBulkSetOpeningStock,
    }), [inventory, orders, vendors, materials, sites, issuances, purchaseIntents, isLoading, notifications, loadData]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook to use the context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};