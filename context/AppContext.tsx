import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import {
  Material, Vendor, Site, InventoryItem, PurchaseOrder, MaterialIssuance, PurchaseIntent,
  AppNotification, OrderStatus, Priority, PurchaseIntentStatus, OrderLineItem, PurchaseIntentLineItem,
} from '../types';
import { supabase } from '../services/supabase';


interface AppContextType {
  materials: Material[];
  vendors: Vendor[];
  sites: Site[];
  inventory: InventoryItem[];
  orders: PurchaseOrder[];
  issuances: MaterialIssuance[];
  purchaseIntents: PurchaseIntent[];
  notifications: AppNotification[];
  addNotification: (type: AppNotification['type'], message: string) => void;
  dismissNotification: (id: number) => void;
  addOrder: (order: Omit<PurchaseOrder, 'id'>) => void;
  updateOrder: (order: PurchaseOrder) => void;
  markOrderAsDelivered: (orderId: string, receivedBy: string) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string, rejectedBy: string) => void;
  addVendor: (name: string) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;
  addMaterial: (name: string, unit: string) => void;
  updateMaterial: (material: Material) => void;
  deleteMaterial: (materialId: string) => void;
  addSite: (name: string) => void;
  updateSite: (site: Site) => void;
  deleteSite: (siteId: string) => void;
  issueMaterial: (materialId: string, quantity: number, unit: string, issuedToSite: string, notes: string | undefined, issuedBy: string) => void;
  addPurchaseIntent: (intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status'>) => void;
  approvePurchaseIntent: (intentId: string) => void;
  rejectPurchaseIntent: (intentId: string, reason: string, reviewedBy: string) => void;
  convertIntentToOrder: (intentId: string) => Partial<PurchaseOrder>;
  setOpeningStock: (payload: { updatedStocks: { materialId: string; quantity: number; unit: string; }[]; newItems: { name: string; unit: string; quantity: number }[] }) => void;
  addBulkStock: (data: { name: string; unit: string; quantity: number; threshold: number }[]) => void;
  addBulkMaterials: (data: { name: string, unit?: string }[]) => void;
  addBulkVendors: (data: { name: string }[]) => void;
  addBulkSites: (data: { name: string }[]) => void;
  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [issuances, setIssuances] = useState<MaterialIssuance[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const addNotification = useCallback((type: AppNotification['type'], message: string) => {
    setNotifications(prev => [...prev, { id: Date.now(), type, message }]);
    setTimeout(() => {
        setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        materialsRes,
        vendorsRes,
        sitesRes,
        inventoryRes,
        ordersBaseRes,
        lineItemsRes,
        intentsBaseRes,
        intentLineItemsRes,
        issuancesRes,
      ] = await Promise.all([
        supabase.from('materials').select('*').order('name'),
        supabase.from('vendors').select('*').order('name'),
        supabase.from('sites').select('*').order('name'),
        supabase.from('inventory').select('*'),
        supabase.from('purchase_orders').select('*').order('ordered_on', { ascending: false }),
        supabase.from('order_line_items').select('*'),
        supabase.from('purchase_intents').select('*').order('requested_on', { ascending: false }),
        supabase.from('purchase_intent_line_items').select('*'),
        supabase.from('material_issuances').select('*').order('issued_on', { ascending: false }),
      ]);

      const results = [materialsRes, vendorsRes, sitesRes, inventoryRes, ordersBaseRes, lineItemsRes, intentsBaseRes, intentLineItemsRes, issuancesRes];
      for (const res of results) {
        if (res.error) throw res.error;
      }

      const materialsData = materialsRes.data || [];
      setMaterials(materialsData as Material[]);

      const vendorsData = vendorsRes.data || [];
      setVendors(vendorsData as Vendor[]);

      const sitesData = sitesRes.data || [];
      setSites(sitesData as Site[]);

      const inventoryItems = inventoryRes.data || [];
      const inventoryData = materialsData.map(material => {
        const invItem = inventoryItems.find(i => i.material_id === material.id);
        return {
          id: material.id,
          name: material.name,
          unit: material.unit,
          created_at: material.created_at,
          quantity: invItem?.quantity ?? 0,
          threshold: invItem?.threshold ?? 10,
        };
      });
      setInventory(inventoryData as InventoryItem[]);

      const orderLineItems = lineItemsRes.data || [];
      const ordersData = (ordersBaseRes.data || []).map(order => ({
        id: order.id,
        vendorId: order.vendor_id,
        notes: order.notes,
        priority: order.priority,
        status: order.status,
        orderedOn: order.ordered_on,
        expectedDelivery: order.expected_delivery,
        deliveredOn: order.delivered_on,
        raisedBy: order.raised_by,
        autoGenerated: order.auto_generated,
        approvedBy: order.approved_by,
        approvedOn: order.approved_on,
        rejectedBy: order.rejected_by,
        rejectedOn: order.rejected_on,
        rejectionReason: order.rejection_reason,
        receivedBy: order.received_by,
        intentId: order.intent_id,
        lineItems: orderLineItems.filter(li => li.order_id === order.id).map(li => ({
          id: li.id,
          orderId: li.order_id,
          materialId: li.material_id,
          quantity: li.quantity,
          unit: li.unit,
          specifications: li.specifications,
          size: li.size,
          brand: li.brand,
          site: li.site,
          rate: li.rate,
          gst: li.gst,
          discount: li.discount,
          freight: li.freight,
          created_at: li.created_at,
        })),
      }));
      setOrders(ordersData as PurchaseOrder[]);

      const intentLineItems = intentLineItemsRes.data || [];
      const intentsData = (intentsBaseRes.data || []).map(intent => ({
        id: intent.id,
        notes: intent.notes,
        requestedBy: intent.requested_by,
        requestedOn: intent.requested_on,
        status: intent.status,
        reviewedBy: intent.reviewed_by,
        reviewedOn: intent.reviewed_on,
        rejectionReason: intent.rejection_reason,
        lineItems: intentLineItems.filter(li => li.intent_id === intent.id).map(li => ({
          id: li.id,
          intentId: li.intent_id,
          materialId: li.material_id,
          quantity: li.quantity,
          unit: li.unit,
          site: li.site,
          notes: li.notes,
          created_at: li.created_at,
        })),
      }));
      setPurchaseIntents(intentsData as PurchaseIntent[]);

      const issuancesData = (issuancesRes.data || []).map(issuance => ({
        id: issuance.id,
        materialId: issuance.material_id,
        quantity: issuance.quantity,
        unit: issuance.unit,
        issuedToSite: issuance.issued_to_site,
        issuedBy: issuance.issued_by,
        issuedOn: issuance.issued_on,
        notes: issuance.notes,
      }));
      setIssuances(issuancesData as MaterialIssuance[]);

    } catch (error: any) {
        console.error('Error fetching data:', error);
        let errorMessage = 'An unknown error occurred.';
        if (typeof error === 'object' && error !== null) {
            if ('message' in error && typeof error.message === 'string' && error.message) {
                errorMessage = error.message;
            } else {
                try {
                    // Attempt to stringify for more complex error objects
                    errorMessage = JSON.stringify(error);
                } catch {
                    // Fallback for unserializable objects (e.g., with circular references)
                    errorMessage = 'An unserializable error object was thrown. Check the console.';
                }
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        addNotification('danger', `Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addOrder = useCallback(async (order: Omit<PurchaseOrder, 'id'>) => {
    const { lineItems, ...orderProps } = order;
    
    const { data: newOrderData, error } = await supabase.from('purchase_orders').insert({
      vendor_id: orderProps.vendorId,
      notes: orderProps.notes,
      priority: orderProps.priority,
      status: orderProps.status,
      ordered_on: orderProps.orderedOn,
      expected_delivery: orderProps.expectedDelivery,
      raised_by: orderProps.raisedBy,
      auto_generated: orderProps.autoGenerated,
      intent_id: orderProps.intentId
    }).select().single();

    if (error || !newOrderData) {
      addNotification('danger', `Failed to create order: ${error?.message}`);
      return;
    }

    const lineItemsToInsert = lineItems.map(li => {
      // remove client-side properties before insert
      const {id, orderId, ...rest} = li;
      return {
        ...rest,
        order_id: newOrderData.id,
        material_id: li.materialId,
      };
    });

    const { data: newLineItemsData, error: liError } = await supabase.from('order_line_items').insert(lineItemsToInsert).select();
    
    if (liError) {
      addNotification('danger', `Failed to add order items: ${liError.message}`);
      await supabase.from('purchase_orders').delete().eq('id', newOrderData.id); // Rollback
      return;
    }
    
    const newLineItems: OrderLineItem[] = (newLineItemsData || []).map(li => ({
        id: li.id,
        orderId: li.order_id,
        materialId: li.material_id,
        quantity: li.quantity,
        unit: li.unit,
        specifications: li.specifications,
        size: li.size,
        brand: li.brand,
        site: li.site,
        rate: li.rate,
        gst: li.gst,
        discount: li.discount,
        freight: li.freight,
        created_at: li.created_at,
    }));

    const finalOrder = { 
        id: newOrderData.id,
        vendorId: newOrderData.vendor_id,
        notes: newOrderData.notes,
        priority: newOrderData.priority,
        status: newOrderData.status,
        orderedOn: newOrderData.ordered_on,
        expectedDelivery: newOrderData.expected_delivery,
        raisedBy: newOrderData.raised_by,
        autoGenerated: newOrderData.auto_generated,
        intentId: newOrderData.intent_id,
        lineItems: newLineItems 
    } as PurchaseOrder;

    setOrders(prev => [finalOrder, ...prev]);
    addNotification('success', `Order ${finalOrder.id} created successfully.`);
  }, [addNotification]);

  const updateOrder = useCallback(async (updatedOrder: PurchaseOrder) => {
    const { lineItems, ...orderProps } = updatedOrder;

    const { data: updatedOrderData, error } = await supabase.from('purchase_orders').update({
        vendor_id: orderProps.vendorId,
        notes: orderProps.notes,
        priority: orderProps.priority,
        expected_delivery: orderProps.expectedDelivery,
    }).eq('id', orderProps.id).select().single();

    if (error || !updatedOrderData) {
        addNotification('danger', `Failed to update order: ${error?.message}`);
        return;
    }
    
    await supabase.from('order_line_items').delete().eq('order_id', orderProps.id);

    const lineItemsToInsert = lineItems.map(li => {
      const {id, orderId, ...rest} = li;
      return { ...rest, order_id: orderProps.id, material_id: li.materialId };
    });

    const { data: newLineItemsData, error: liError } = await supabase.from('order_line_items').insert(lineItemsToInsert).select();

    if (liError) {
        addNotification('danger', `Failed to update order items: ${liError.message}`);
        fetchData(); 
        return;
    }

    const newLineItems: OrderLineItem[] = (newLineItemsData || []).map(li => ({
        id: li.id,
        orderId: li.order_id,
        materialId: li.material_id,
        quantity: li.quantity,
        unit: li.unit,
        specifications: li.specifications,
        size: li.size,
        brand: li.brand,
        site: li.site,
        rate: li.rate,
        gst: li.gst,
        discount: li.discount,
        freight: li.freight,
        created_at: li.created_at,
    }));

    const finalOrder = { 
        id: updatedOrderData.id,
        vendorId: updatedOrderData.vendor_id,
        notes: updatedOrderData.notes,
        priority: updatedOrderData.priority,
        status: updatedOrderData.status,
        orderedOn: updatedOrderData.ordered_on,
        expectedDelivery: updatedOrderData.expected_delivery,
        deliveredOn: updatedOrderData.delivered_on,
        raisedBy: updatedOrderData.raised_by,
        autoGenerated: updatedOrderData.auto_generated,
        approvedBy: updatedOrderData.approved_by,
        approvedOn: updatedOrderData.approved_on,
        rejectedBy: updatedOrderData.rejected_by,
        rejectedOn: updatedOrderData.rejected_on,
        rejectionReason: updatedOrderData.rejection_reason,
        receivedBy: updatedOrderData.received_by,
        intentId: updatedOrderData.intent_id,
        created_at: updatedOrderData.created_at,
        lineItems: newLineItems
    } as PurchaseOrder;

    setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    addNotification('success', `Order ${finalOrder.id} updated successfully.`);
  }, [addNotification, fetchData]);
  
  const markOrderAsDelivered = useCallback(async (orderId: string, receivedBy: string) => {
    const orderToDeliver = orders.find(o => o.id === orderId);
    if (!orderToDeliver) return;

    try {
        for (const li of orderToDeliver.lineItems) {
            const { data: currentItem, error: fetchError } = await supabase.from('inventory').select('quantity').eq('material_id', li.materialId).single();
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (currentItem) {
                const { error: updateError } = await supabase.from('inventory').update({ quantity: currentItem.quantity + li.quantity }).eq('material_id', li.materialId);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('inventory').insert({ material_id: li.materialId, quantity: li.quantity, threshold: 10, unit: li.unit });
                if (insertError) throw insertError;
            }
        }
    } catch(error: any) {
        addNotification('danger', `Failed to update inventory: ${error.message}. Delivery not confirmed.`);
        return;
    }
    
    const { error: updateOrderError } = await supabase.from('purchase_orders')
      .update({ status: OrderStatus.Delivered, delivered_on: new Date().toISOString().split('T')[0], received_by: receivedBy })
      .eq('id', orderId);

    if (updateOrderError) {
        addNotification('danger', `Failed to update order status: ${updateOrderError.message}. Inventory may be inconsistent.`);
        fetchData();
        return;
    }
    
    fetchData(); 
    addNotification('success', `Order ${orderId} marked as delivered. Inventory updated.`);
  }, [orders, addNotification, fetchData]);


  const approveOrder = useCallback(async (orderId: string) => {
      const { error } = await supabase.from('purchase_orders').update({
          status: OrderStatus.Pending,
          approved_by: 'Manager', 
          approved_on: new Date().toISOString().split('T')[0]
      }).eq('id', orderId);

      if(error) {
        addNotification('danger', `Approval failed: ${error.message}`);
        return;
      }
      
      fetchData();
      addNotification('success', `Order ${orderId} has been approved.`);
  }, [addNotification, fetchData]);

  const rejectOrder = useCallback(async (orderId: string, reason: string, rejectedBy: string) => {
      const { error } = await supabase.from('purchase_orders').update({
          status: OrderStatus.Cancelled,
          rejected_by: rejectedBy,
          rejection_reason: reason,
          rejected_on: new Date().toISOString().split('T')[0]
      }).eq('id', orderId);
      
      if(error) {
        addNotification('danger', `Rejection failed: ${error.message}`);
        return;
      }

      fetchData();
      addNotification('danger', `Order ${orderId} has been rejected.`);
  }, [addNotification, fetchData]);

  const addVendor = useCallback(async (name: string) => {
      const { data, error } = await supabase.from('vendors').insert({ name }).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setVendors(prev => [...prev, data]);
      addNotification('success', `Vendor "${name}" added.`);
  }, [addNotification]);
  
  const updateVendor = useCallback(async (vendor: Vendor) => {
      const { data, error } = await supabase.from('vendors').update({ name: vendor.name }).eq('id', vendor.id).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setVendors(prev => prev.map(v => v.id === vendor.id ? data : v));
      addNotification('success', `Vendor "${vendor.name}" updated.`);
  }, [addNotification]);

  const deleteVendor = useCallback(async (vendorId: string) => {
      const vendorName = vendors.find(v => v.id === vendorId)?.name;
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) { addNotification('danger', error.message); return; }
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      addNotification('danger', `Vendor "${vendorName}" deleted.`);
  }, [addNotification, vendors]);

  const addMaterial = useCallback(async (name: string, unit: string) => {
      const { data, error } = await supabase.from('materials').insert({ name, unit }).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setMaterials(prev => [...prev, data]);
      addNotification('success', `Material "${name}" added.`);
  }, [addNotification]);

  const updateMaterial = useCallback(async (material: Material) => {
      const { data, error } = await supabase.from('materials').update({ name: material.name, unit: material.unit }).eq('id', material.id).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setMaterials(prev => prev.map(m => m.id === material.id ? data : m));
      addNotification('success', `Material "${material.name}" updated.`);
  }, [addNotification]);

  const deleteMaterial = useCallback(async (materialId: string) => {
      const materialName = materials.find(m => m.id === materialId)?.name;
      const { error } = await supabase.from('materials').delete().eq('id', materialId);
      if (error) { addNotification('danger', error.message); return; }
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      addNotification('danger', `Material "${materialName}" deleted.`);
  }, [addNotification, materials]);

  const addSite = useCallback(async (name: string) => {
      const { data, error } = await supabase.from('sites').insert({ name }).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setSites(prev => [...prev, data]);
      addNotification('success', `Site "${name}" added.`);
  }, [addNotification]);

  const updateSite = useCallback(async (site: Site) => {
      const { data, error } = await supabase.from('sites').update({ name: site.name }).eq('id', site.id).select().single();
      if (error) { addNotification('danger', error.message); return; }
      setSites(prev => prev.map(s => s.id === site.id ? data : s));
      addNotification('success', `Site "${site.name}" updated.`);
  }, [addNotification]);

  const deleteSite = useCallback(async (siteId: string) => {
      const siteName = sites.find(s => s.id === siteId)?.name;
      const { error } = await supabase.from('sites').delete().eq('id', siteId);
      if (error) { addNotification('danger', error.message); return; }
      setSites(prev => prev.filter(s => s.id !== siteId));
      addNotification('danger', `Site "${siteName}" deleted.`);
  }, [addNotification, sites]);

  const issueMaterial = useCallback(async (materialId: string, quantity: number, unit: string, issuedToSite: string, notes: string | undefined, issuedBy: string) => {
    const { data: currentItem, error: fetchError } = await supabase.from('inventory').select('quantity').eq('material_id', materialId).single();
    if (fetchError || !currentItem || currentItem.quantity < quantity) {
        addNotification('danger', fetchError ? fetchError.message : 'Insufficient stock.');
        return;
    }
    const { error: updateError } = await supabase.from('inventory').update({ quantity: currentItem.quantity - quantity }).eq('material_id', materialId);
    if(updateError) { addNotification('danger', `Failed to update inventory: ${updateError.message}`); return; }

    // FIX: The 'id' column in 'material_issuances' violates a not-null constraint
    // because it's not being auto-generated by the database. A client-side ID is
    // now generated and included in the insert payload to resolve this error.
    const { error: insertError } = await supabase.from('material_issuances').insert({
        id: `ISS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        material_id: materialId, quantity, unit, issued_to_site: issuedToSite, notes, issued_by: issuedBy, issued_on: new Date().toISOString().split('T')[0],
    });
    if (insertError) {
        addNotification('danger', `Failed to record issuance: ${insertError.message}`);
        await supabase.from('inventory').update({ quantity: currentItem.quantity }).eq('material_id', materialId); // Rollback
        return;
    }
    fetchData();
    const materialName = materials.find(m => m.id === materialId)?.name;
    addNotification('success', `${quantity} ${unit} of ${materialName} issued to ${issuedToSite}.`);
  }, [addNotification, materials, fetchData]);

  const addPurchaseIntent = useCallback(async (intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status'>) => {
    // FIX: Destructure 'requestedBy' to prevent it from being spread into the
    // insert object with the wrong (camelCase) key, which caused a "column not found" error.
    const { lineItems, requestedBy, ...intentProps } = intent;
    
    // FIX: A 'not-null constraint' error on the 'id' column indicates it is not
    // being auto-generated by the database. A client-side ID is now generated
    // and included in the insert payload to resolve the issue when raising a
    // purchase indent.
    const { data, error } = await supabase.from('purchase_intents').insert({
        id: `INT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...intentProps,
        requested_by: requestedBy,
        requested_on: new Date().toISOString().split('T')[0],
        status: PurchaseIntentStatus.Pending,
    }).select().single();
    
    if (error || !data) { addNotification('danger', `Failed to create intent: ${error?.message}`); return; }
    
    const liToInsert = lineItems.map(li => ({ ...li, intent_id: data.id, material_id: li.materialId }));
    const { error: liError } = await supabase.from('purchase_intent_line_items').insert(liToInsert);
    
    if (liError) {
        addNotification('danger', `Failed to add intent items: ${liError.message}`);
        await supabase.from('purchase_intents').delete().eq('id', data.id); // Rollback
        return;
    }
    
    fetchData();
    addNotification('success', `Purchase Intent ${data.id} raised successfully.`);
  }, [addNotification, fetchData]);
  
  const approvePurchaseIntent = useCallback(async (intentId: string) => {
    const { error } = await supabase.from('purchase_intents').update({ status: PurchaseIntentStatus.Approved }).eq('id', intentId);
    if(error) { addNotification('danger', error.message); return; }
    fetchData();
    addNotification('success', `Intent ${intentId} approved for PO creation.`);
  }, [addNotification, fetchData]);

  const rejectPurchaseIntent = useCallback(async (intentId: string, reason: string, reviewedBy: string) => {
    const { error } = await supabase.from('purchase_intents').update({ 
        status: PurchaseIntentStatus.Rejected, 
        rejection_reason: reason, 
        reviewed_by: reviewedBy, 
        reviewed_on: new Date().toISOString().split('T')[0] 
    }).eq('id', intentId);
    if(error) { addNotification('danger', error.message); return; }
    fetchData();
    addNotification('danger', `Intent ${intentId} has been rejected.`);
  }, [addNotification, fetchData]);
  
  const convertIntentToOrder = useCallback((intentId: string): Partial<PurchaseOrder> => {
      const intent = purchaseIntents.find(i => i.id === intentId);
      if (!intent) return {};
      
      const lineItems: Partial<OrderLineItem>[] = intent.lineItems.map(li => ({
          materialId: li.materialId, quantity: li.quantity, unit: li.unit, site: li.site, specifications: li.notes || '', gst: 18, rate: 0,
      }));

      supabase.from('purchase_intents').update({ status: PurchaseIntentStatus.Converted }).eq('id', intentId).then(({error}) => {
          if(error) addNotification('warning', `Failed to update intent status: ${error.message}`);
          else setPurchaseIntents(prev => prev.map(i => i.id === intentId ? {...i, status: PurchaseIntentStatus.Converted} : i));
      });
      addNotification('info', `Creating new PO from Intent ${intentId}.`);

      return {
          lineItems: lineItems as OrderLineItem[],
          notes: `Generated from Purchase Intent ${intent.id}. Reason: ${intent.notes || 'N/A'}`,
          intentId: intent.id,
      };
  }, [purchaseIntents, addNotification]);

  const setOpeningStock = useCallback(async (payload: { updatedStocks: { materialId: string; quantity: number, unit: string }[]; newItems: { name: string; unit: string; quantity: number }[] }) => {
    const newMaterialsToInsert = payload.newItems.map(item => ({ name: item.name, unit: item.unit }));
    let newMaterials: Material[] = [];

    if (newMaterialsToInsert.length > 0) {
        const { data, error } = await supabase.from('materials').insert(newMaterialsToInsert).select();
        if (error || !data) { addNotification('danger', `Failed to add new materials: ${error?.message}`); return; }
        newMaterials = data;
    }

    const inventoryUpserts = payload.updatedStocks.map(s => ({ material_id: s.materialId, quantity: s.quantity, unit: s.unit, threshold: inventory.find(i => i.id === s.materialId)?.threshold || 10 }));
    
    newMaterials.forEach((mat, i) => {
        const newItem = payload.newItems[i];
        inventoryUpserts.push({ material_id: mat.id, quantity: newItem.quantity, unit: newItem.unit, threshold: 10 });
    });

    const { error: upsertError } = await supabase.from('inventory').upsert(inventoryUpserts, { onConflict: 'material_id' });
    if(upsertError) { addNotification('danger', `Failed to update stock: ${upsertError.message}`); return; }
    
    fetchData();
    addNotification('success', 'Stock levels have been updated.');
  }, [addNotification, fetchData, inventory]);

  const addBulkStock = useCallback(async (data: { name: string; unit: string; quantity: number; threshold: number }[]) => {
      await Promise.all(data.map(async item => {
          let material = materials.find(m => m.name.toLowerCase() === item.name.toLowerCase());
          if (!material) {
              const { data: newMat, error } = await supabase.from('materials').insert({ name: item.name, unit: item.unit }).select().single();
              if (error || !newMat) { console.error(error); return; }
              material = newMat;
          }
          await supabase.from('inventory').upsert({ material_id: material.id, quantity: item.quantity, threshold: item.threshold, unit: item.unit }, { onConflict: 'material_id' });
      }));
      fetchData();
      addNotification('success', `${data.length} stock records processed from upload.`);
  }, [materials, addNotification, fetchData]);
  
  const addBulkMaterials = useCallback(async (data: { name: string, unit?: string }[]) => {
    const newMaterials = data.filter(d => !materials.some(m => m.name.toLowerCase() === d.name.toLowerCase())).map(d => ({ name: d.name, unit: d.unit || 'Nos.' }));
    if(newMaterials.length === 0) { addNotification('info', 'All materials already exist.'); return; }
    await supabase.from('materials').insert(newMaterials);
    fetchData();
    addNotification('success', `${newMaterials.length} new materials added.`);
  }, [materials, addNotification, fetchData]);

  const addBulkVendors = useCallback(async (data: { name: string }[]) => {
    const newVendors = data.filter(d => !vendors.some(v => v.name.toLowerCase() === d.name.toLowerCase()));
    if(newVendors.length === 0) { addNotification('info', 'All vendors already exist.'); return; }
    await supabase.from('vendors').insert(newVendors);
    fetchData();
    addNotification('success', `${newVendors.length} new vendors added.`);
  }, [vendors, addNotification, fetchData]);

  const addBulkSites = useCallback(async (data: { name: string }[]) => {
    const newSites = data.filter(d => !sites.some(s => s.name.toLowerCase() === d.name.toLowerCase()));
    if(newSites.length === 0) { addNotification('info', 'All sites already exist.'); return; }
    await supabase.from('sites').insert(newSites);
    fetchData();
    addNotification('success', `${newSites.length} new sites/clients added.`);
  }, [sites, addNotification, fetchData]);

  const updateInventoryItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>) => {
    const { unit, ...invUpdates } = updates;
    if (Object.keys(invUpdates).length > 0) {
        await supabase.from('inventory').update(invUpdates).eq('material_id', itemId);
    }
    if (unit) {
        await supabase.from('materials').update({ unit }).eq('id', itemId);
    }
    fetchData();
    addNotification('success', `Inventory item updated successfully.`);
  }, [addNotification, fetchData]);


  const value = {
    materials, vendors, sites, inventory, orders, issuances, purchaseIntents, notifications,
    addNotification, dismissNotification,
    addOrder, updateOrder, markOrderAsDelivered, approveOrder, rejectOrder, addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial, addSite, updateSite, deleteSite, issueMaterial,
    addPurchaseIntent, approvePurchaseIntent, rejectPurchaseIntent, convertIntentToOrder, setOpeningStock, addBulkStock,
    addBulkMaterials, addBulkVendors, addBulkSites, updateInventoryItem
  };

  return <AppContext.Provider value={value}>{!loading && children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};