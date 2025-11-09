import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  Material, Vendor, Site, InventoryItem, PurchaseOrder, MaterialIssuance, PurchaseIntent,
  AppNotification, OrderStatus, Priority, PurchaseIntentStatus, OrderLineItem, PurchaseIntentLineItem,
} from '../types';
import {
  INITIAL_MATERIALS, INITIAL_VENDORS, INITIAL_SITES, INITIAL_INVENTORY, INITIAL_ORDERS,
} from '../constants';

interface AppContextType {
  materials: Material[];
  vendors: Vendor[];
  sites: Site[];
  inventory: InventoryItem[];
  orders: PurchaseOrder[];
  issuances: MaterialIssuance[];
  purchaseIntents: PurchaseIntent[];
  notifications: AppNotification[];
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
  const [materials, setMaterials] = useState<Material[]>(() => 
    INITIAL_MATERIALS.map((m, i) => ({ ...m, id: `M-${i + 1}` }))
  );
  const [vendors, setVendors] = useState<Vendor[]>(() =>
    INITIAL_VENDORS.map((v, i) => ({ ...v, id: `V-${i + 1}` }))
  );
  const [sites, setSites] = useState<Site[]>(() =>
    INITIAL_SITES.map((s, i) => ({ ...s, id: `S-${i + 1}` }))
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const allMaterials = INITIAL_MATERIALS.map((m, i) => ({ ...m, id: `M-${i + 1}` }));
    return INITIAL_INVENTORY.map((item, i) => {
      const material = allMaterials.find(m => m.name === item.name);
      return { 
        ...item, 
        id: material?.id || `I-${i + 1}`,
        name: material?.name || item.name,
        unit: material?.unit || item.unit
      };
    })
  });
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const allMaterials = INITIAL_MATERIALS.map((m, i) => ({ ...m, id: `M-${i + 1}` }));
    const allVendors = INITIAL_VENDORS.map((v, i) => ({ ...v, id: `V-${i + 1}` }));
    
    return INITIAL_ORDERS.map((order, i) => {
      const vendor = allVendors.find(v => v.name === order.vendorName);
      const poId = `PO-00${i + 1}`;
      return {
        ...order,
        id: poId,
        vendorId: vendor?.id || 'V-UNKNOWN',
        lineItems: order.lineItems.map((li, j) => {
            const material = allMaterials.find(m => m.name === li.materialName);
            return {
                ...li,
                id: `LI-${poId}-${j}`,
                orderId: poId,
                materialId: material?.id || 'M-UNKNOWN',
                specifications: li.specifications || '',
                gst: li.gst || 18
            }
        })
      };
    });
  });

  const [issuances, setIssuances] = useState<MaterialIssuance[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((type: AppNotification['type'], message: string) => {
    setNotifications(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

  const addOrder = useCallback((order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: `PO-${Date.now()}`
    };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const updateOrder = useCallback((updatedOrder: PurchaseOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }, []);
  
  const markOrderAsDelivered = useCallback((orderId: string, receivedBy: string) => {
    setOrders(prevOrders => {
        const orderToDeliver = prevOrders.find(o => o.id === orderId);
        if (!orderToDeliver) return prevOrders;

        setInventory(prevInventory => {
            const newInventory = [...prevInventory];
            orderToDeliver.lineItems.forEach(li => {
                const itemIndex = newInventory.findIndex(invItem => invItem.id === li.materialId);
                if (itemIndex > -1) {
                    newInventory[itemIndex].quantity += li.quantity;
                } else {
                    const material = materials.find(m => m.id === li.materialId);
                    if (material) {
                         newInventory.push({
                            ...material,
                            quantity: li.quantity,
                            threshold: 10 // default threshold for new items
                        });
                    }
                }
            });
            return newInventory;
        });
        
        return prevOrders.map(o => 
            o.id === orderId ? { 
                ...o, 
                status: OrderStatus.Delivered, 
                deliveredOn: new Date().toISOString().split('T')[0],
                receivedBy 
            } : o
        );
    });
}, [materials]);


  const approveOrder = useCallback((orderId: string) => {
      updateOrder({
          ...orders.find(o => o.id === orderId)!,
          status: OrderStatus.Pending,
          approvedBy: 'Manager', // In a real app, this would be the current user's name
          approvedOn: new Date().toISOString().split('T')[0]
      });
  }, [orders, updateOrder]);

  const rejectOrder = useCallback((orderId: string, reason: string, rejectedBy: string) => {
       updateOrder({
          ...orders.find(o => o.id === orderId)!,
          status: OrderStatus.Cancelled, // Or a new "Rejected" status
          rejectedBy,
          rejectionReason: reason,
          rejectedOn: new Date().toISOString().split('T')[0]
      });
  }, [orders, updateOrder]);

  // Vendor Management
  const addVendor = useCallback((name: string) => setVendors(prev => [...prev, { id: `V-${Date.now()}`, name }]), []);
  const updateVendor = useCallback((vendor: Vendor) => setVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v)), []);
  const deleteVendor = useCallback((vendorId: string) => setVendors(prev => prev.filter(v => v.id !== vendorId)), []);

  // Material Management
  const addMaterial = useCallback((name: string, unit: string) => setMaterials(prev => [...prev, { id: `M-${Date.now()}`, name, unit }]), []);
  const updateMaterial = useCallback((material: Material) => setMaterials(prev => prev.map(m => m.id === material.id ? material : m)), []);
  const deleteMaterial = useCallback((materialId: string) => setMaterials(prev => prev.filter(m => m.id !== materialId)), []);

  // Site Management
  const addSite = useCallback((name: string) => setSites(prev => [...prev, { id: `S-${Date.now()}`, name }]), []);
  const updateSite = useCallback((site: Site) => setSites(prev => prev.map(s => s.id === site.id ? site : s)), []);
  const deleteSite = useCallback((siteId: string) => setSites(prev => prev.filter(s => s.id !== siteId)), []);

  // Material Issuance
  const issueMaterial = useCallback((materialId: string, quantity: number, unit: string, issuedToSite: string, notes: string | undefined, issuedBy: string) => {
      setInventory(prev => prev.map(item => item.id === materialId ? { ...item, quantity: item.quantity - quantity } : item));
      setIssuances(prev => [...prev, {
          id: `ISS-${Date.now()}`,
          materialId,
          quantity,
          unit,
          issuedToSite,
          issuedBy,
          issuedOn: new Date().toISOString().split('T')[0],
          notes,
      }]);
  }, []);

  // Purchase Intent
  const addPurchaseIntent = useCallback((intent: Omit<PurchaseIntent, 'id' | 'requestedOn' | 'status'>) => {
    const newIntent: PurchaseIntent = {
      ...intent,
      id: `PI-${Date.now()}`,
      requestedOn: new Date().toISOString().split('T')[0],
      status: PurchaseIntentStatus.Pending,
    };
    setPurchaseIntents(prev => [newIntent, ...prev]);
  }, []);
  
  const approvePurchaseIntent = useCallback((intentId: string) => {
    setPurchaseIntents(prev => prev.map(i => i.id === intentId ? {...i, status: PurchaseIntentStatus.Approved} : i));
  }, []);

  const rejectPurchaseIntent = useCallback((intentId: string, reason: string, reviewedBy: string) => {
    setPurchaseIntents(prev => prev.map(i => i.id === intentId ? {...i, status: PurchaseIntentStatus.Rejected, rejectionReason: reason, reviewedBy, reviewedOn: new Date().toISOString().split('T')[0]} : i));
  }, []);
  
  const convertIntentToOrder = useCallback((intentId: string): Partial<PurchaseOrder> => {
      const intent = purchaseIntents.find(i => i.id === intentId);
      if (!intent) return {};
      
      const lineItems: Partial<OrderLineItem>[] = intent.lineItems.map(li => ({
          materialId: li.materialId,
          quantity: li.quantity,
          unit: li.unit,
          site: li.site,
          specifications: li.notes || '',
          gst: 18,
      }));

      setPurchaseIntents(prev => prev.map(i => i.id === intentId ? {...i, status: PurchaseIntentStatus.Converted} : i));

      return {
          lineItems: lineItems as OrderLineItem[],
          notes: `Generated from Purchase Intent ${intent.id}. Reason: ${intent.notes}`,
          intentId: intent.id,
      };
  }, [purchaseIntents]);

  const setOpeningStock = useCallback((payload: { updatedStocks: { materialId: string; quantity: number, unit: string }[]; newItems: { name: string; unit: string; quantity: number }[] }) => {
    const newMaterials = payload.newItems.map(item => {
        const newMaterial: Material = { id: `M-new-${Date.now()}-${Math.random()}`, name: item.name, unit: item.unit };
        return newMaterial;
    });
    
    if (newMaterials.length > 0) {
        setMaterials(prev => [...prev, ...newMaterials]);
    }

    setInventory(prev => {
        let updated = [...prev];
        payload.updatedStocks.forEach(stock => {
            const index = updated.findIndex(i => i.id === stock.materialId);
            if(index > -1) {
              updated[index].quantity = stock.quantity;
              updated[index].unit = stock.unit; // Also update unit here
            }
        });
        payload.newItems.forEach((item, i) => {
            updated.push({
                id: newMaterials[i].id,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                threshold: 10 // default threshold
            })
        })
        return updated;
    });

    setMaterials(prev => {
      let updated = [...prev];
      payload.updatedStocks.forEach(stock => {
        const index = updated.findIndex(m => m.id === stock.materialId);
        if (index > -1) {
          updated[index].unit = stock.unit;
        }
      });
      return updated;
    });

  }, []);

  const addBulkStock = useCallback((data: { name: string; unit: string; quantity: number; threshold: number }[]) => {
      let newMaterials: Material[] = [];
      let newInventoryItems: InventoryItem[] = [];
      const updatedInventory = [...inventory];

      data.forEach(item => {
          const existingMaterial = materials.find(m => m.name.toLowerCase() === item.name.toLowerCase());
          if (existingMaterial) {
              const invIndex = updatedInventory.findIndex(i => i.id === existingMaterial.id);
              if (invIndex > -1) {
                  updatedInventory[invIndex] = { ...updatedInventory[invIndex], quantity: item.quantity, threshold: item.threshold, unit: item.unit };
              }
          } else {
              const newMat: Material = { id: `M-bulk-${Date.now()}-${item.name}`, name: item.name, unit: item.unit };
              newMaterials.push(newMat);
              newInventoryItems.push({ ...newMat, quantity: item.quantity, threshold: item.threshold });
          }
      });
      setMaterials(prev => [...prev, ...newMaterials]);
      setInventory([...updatedInventory, ...newInventoryItems]);
  }, [materials, inventory]);
  
  const addBulkMaterials = useCallback((data: { name: string, unit?: string }[]) => {
    const newMaterials = data
        .filter(d => !materials.some(m => m.name.toLowerCase() === d.name.toLowerCase()))
        .map(d => ({ id: `M-bulk-${Date.now()}-${d.name}`, name: d.name, unit: d.unit || 'Nos.' }));
    setMaterials(prev => [...prev, ...newMaterials]);
  }, [materials]);

  const addBulkVendors = useCallback((data: { name: string }[]) => {
    const newVendors = data
        .filter(d => !vendors.some(v => v.name.toLowerCase() === d.name.toLowerCase()))
        .map(d => ({ id: `V-bulk-${Date.now()}-${d.name}`, name: d.name }));
    setVendors(prev => [...prev, ...newVendors]);
  }, [vendors]);

  const addBulkSites = useCallback((data: { name: string }[]) => {
    const newSites = data
        .filter(d => !sites.some(s => s.name.toLowerCase() === d.name.toLowerCase()))
        .map(d => ({ id: `S-bulk-${Date.now()}-${d.name}`, name: d.name }));
    setSites(prev => [...prev, ...newSites]);
  }, [sites]);

  const updateInventoryItem = useCallback((itemId: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    if (updates.unit) {
        setMaterials(prev => prev.map(mat => mat.id === itemId ? { ...mat, unit: updates.unit! } : mat));
    }
  }, []);


  const value = {
    materials, vendors, sites, inventory, orders, issuances, purchaseIntents, notifications,
    addOrder, updateOrder, markOrderAsDelivered, approveOrder, rejectOrder, addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial, addSite, updateSite, deleteSite, issueMaterial,
    addPurchaseIntent, approvePurchaseIntent, rejectPurchaseIntent, convertIntentToOrder, setOpeningStock, addBulkStock,
    addBulkMaterials, addBulkVendors, addBulkSites, updateInventoryItem
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};