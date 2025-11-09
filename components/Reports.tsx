import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, Vendor, Material, OrderStatus, User, InventoryItem, MaterialIssuance, Site, PurchaseIntent, PurchaseIntentStatus } from '../types';
import { translations } from '../translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// This is a simplified i18n helper. In a real app, a library like i18next would be used.
// For now, we assume a single language ('en') for simplicity in the component logic.
const t = (key: string) => translations.en[key] || key;


interface ReportsProps {
    orders: PurchaseOrder[];
    vendors: Vendor[];
    materials: Material[];
    currentUser: User;
    inventory: InventoryItem[];
    issuances: MaterialIssuance[];
    purchaseIntents: PurchaseIntent[];
    sites: Site[];
}

type ReportType = 'total' | 'vendor' | 'material' | 'site' | 'consumption' | 'inventory' | 'intent';
type StatusFilterValue = 'pending' | 'delivered' | 'all';

const reportTypeOptions: { [key in ReportType]: string } = {
    total: t('totalOrdersReport'),
    vendor: t('vendorWiseReport'),
    material: t('materialWiseReport'),
    site: t('siteWiseReport'),
    consumption: t('materialConsumptionReport'),
    inventory: t('inventoryReport'),
    intent: t('purchaseIntentReport'),
};

const allReportTypes: ReportType[] = ['total', 'vendor', 'material', 'site', 'consumption', 'inventory', 'intent'];

const reportTypesForRole: { [key in User['role']]: ReportType[] } = {
    manager: allReportTypes,
    purchaser: allReportTypes,
    inventory_manager: allReportTypes,
};

const Reports: React.FC<ReportsProps> = ({ orders, vendors, materials, currentUser, inventory, issuances, purchaseIntents, sites }) => {
    const availableReports = reportTypesForRole[currentUser.role];

    const [reportType, setReportType] = useState<ReportType>(availableReports[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('delivered');
    const [intentStatusFilter, setIntentStatusFilter] = useState<PurchaseIntentStatus | 'all'>('all');
    const [dateFilterType, setDateFilterType] = useState<'orderedOn' | 'deliveredOn'>('deliveredOn');
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [reportHeaders, setReportHeaders] = useState<string[]>([]);
    
    // Reset report type if it's not available for the current role
    useEffect(() => {
        if (!availableReports.includes(reportType)) {
            setReportType(availableReports[0]);
        }
    }, [currentUser, availableReports, reportType]);
    
    const calculateLineTotal = (item: { quantity: number; rate: number; discount?: number; gst: number; freight?: number; }) => {
        const grossAmount = item.quantity * item.rate;
        const discountAmount = grossAmount * ((item.discount || 0) / 100);
        const subTotal = grossAmount - discountAmount;
        const gstAmount = subTotal * (item.gst / 100);
        return subTotal + gstAmount + (item.freight || 0);
    };

    const generateReport = () => {
        let data: any[] = [];
        let headers: string[] = [];

        const isOrderReport = ['total', 'vendor', 'material', 'site'].includes(reportType);

        if (isOrderReport) {
            const filteredOrders = orders.filter(order => {
                if (statusFilter === 'all') {
                    if(order.status === OrderStatus.Cancelled) return false;
                } else {
                    const statusToCompare = statusFilter === 'pending' ? OrderStatus.Pending : OrderStatus.Delivered;
                    if (order.status !== statusToCompare) return false;
                }
                if (startDate && endDate) {
                    const dateToCompare = dateFilterType === 'orderedOn' ? order.orderedOn : order.deliveredOn;
                    if (!dateToCompare) return false;
                    const orderDate = new Date(dateToCompare);
                    return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
                }
                return true;
            });

            switch (reportType) {
                 case 'total':
                    const dateHeader = statusFilter === 'pending' ? t('expectedDeliveryShort') : t('deliveredOnShort');
                    headers = ['PO ID', 'Vendor', t('orderedOn'), dateHeader, 'Total Items', 'Total Amount'];
                    data = filteredOrders.map(order => ({
                        'PO ID': order.id,
                        'Vendor': vendors.find(v => v.id === order.vendorId)?.name || 'N/A',
                        [t('orderedOn')]: order.orderedOn,
                        [dateHeader]: statusFilter === 'pending' ? order.expectedDelivery : order.deliveredOn,
                        'Total Items': order.lineItems.length,
                        'Total Amount': `₹${order.lineItems.reduce((sum, li) => sum + calculateLineTotal(li), 0).toFixed(2)}`
                    }));
                    break;
                
                case 'vendor':
                    headers = ['Vendor', 'Total Orders', 'Total Amount'];
                    // FIX: Changed Map key from number to string to match vendorId type.
                    const vendorMap = new Map<string, { name: string, orderCount: number, totalAmount: number }>();
                    filteredOrders.forEach(order => {
                        let vendorInfo = vendorMap.get(order.vendorId);
                        if(!vendorInfo) {
                            vendorInfo = { name: vendors.find(v => v.id === order.vendorId)?.name || 'N/A', orderCount: 0, totalAmount: 0 };
                        }
                        vendorInfo.orderCount++;
                        vendorInfo.totalAmount += order.lineItems.reduce((sum, li) => sum + calculateLineTotal(li), 0);
                        vendorMap.set(order.vendorId, vendorInfo);
                    });
                    data = Array.from(vendorMap.values()).map(v => ({
                        'Vendor': v.name,
                        'Total Orders': v.orderCount,
                        'Total Amount': `₹${v.totalAmount.toFixed(2)}`
                    }));
                    break;

                case 'material':
                    headers = ['Material', 'Total Quantity Ordered', 'Total Amount'];
                    // FIX: Changed Map key from number to string to match materialId type.
                    const materialMap = new Map<string, { name: string, totalQuantity: number, totalAmount: number, unit: string }>();
                    filteredOrders.forEach(order => {
                        order.lineItems.forEach(li => {
                            let materialInfo = materialMap.get(li.materialId);
                            if(!materialInfo) {
                                const material = materials.find(m => m.id === li.materialId);
                                materialInfo = { name: material?.name || 'N/A', unit: material?.unit || '', totalQuantity: 0, totalAmount: 0 };
                            }
                            materialInfo.totalQuantity += li.quantity;
                            materialInfo.totalAmount += calculateLineTotal(li);
                            materialMap.set(li.materialId, materialInfo);
                        });
                    });
                    data = Array.from(materialMap.values()).map(m => ({
                        'Material': m.name,
                        'Total Quantity Ordered': `${m.totalQuantity} ${m.unit}`,
                        'Total Amount': `₹${m.totalAmount.toFixed(2)}`
                    }));
                    break;

                case 'site':
                    headers = ['Site/Client', 'Total Materials', 'Total Cost'];
                    const siteMap = new Map<string, { materialCount: number, totalCost: number }>();
                    filteredOrders.forEach(order => {
                        order.lineItems.forEach(li => {
                            if (li.site) {
                                let siteInfo = siteMap.get(li.site) || { materialCount: 0, totalCost: 0 };
                                siteInfo.materialCount++;
                                siteInfo.totalCost += calculateLineTotal(li);
                                siteMap.set(li.site, siteInfo);
                            }
                        })
                    });
                    data = Array.from(siteMap.entries()).map(([site, info]) => ({
                        'Site/Client': site,
                        'Total Materials': info.materialCount,
                        'Total Cost': `₹${info.totalCost.toFixed(2)}`
                    }));
                    break;
            }
        } else {
            switch (reportType) {
                case 'consumption':
                    headers = ['Issue ID', 'Material', 'Quantity', 'Unit', 'Issued To', 'Issued By', 'Issued On'];
                    data = issuances
                        .filter(iss => {
                            if (startDate && endDate) {
                                const issueDate = new Date(iss.issuedOn);
                                return issueDate >= new Date(startDate) && issueDate <= new Date(endDate);
                            }
                            return true;
                        })
                        .map(iss => ({
                            'Issue ID': iss.id,
                            'Material': materials.find(m => m.id === iss.materialId)?.name || 'N/A',
                            'Quantity': iss.quantity,
                            'Unit': iss.unit,
                            'Issued To': iss.issuedToSite,
                            'Issued By': iss.issuedBy,
                            'Issued On': iss.issuedOn
                        }));
                    break;

                case 'inventory':
                    headers = ['Material', 'Current Stock', 'Threshold', 'Unit', 'Status'];
                    data = inventory.map(item => ({
                        'Material': item.name,
                        'Current Stock': item.quantity,
                        'Threshold': item.threshold,
                        'Unit': item.unit,
                        'Status': item.quantity <= item.threshold ? t('belowThreshold') : t('healthy'),
                    }));
                    break;
                
                case 'intent':
                    headers = ['Intent ID', 'Requested By', 'Requested On', 'Status', 'Items'];
                     data = purchaseIntents
                        .filter(intent => {
                            if (intentStatusFilter !== 'all' && intent.status !== intentStatusFilter) return false;
                            if (startDate && endDate) {
                                const intentDate = new Date(intent.requestedOn);
                                return intentDate >= new Date(startDate) && intentDate <= new Date(endDate);
                            }
                            return true;
                        })
                        .map(intent => ({
                            'Intent ID': intent.id,
                            'Requested By': intent.requestedBy,
                            'Requested On': intent.requestedOn,
                            'Status': intent.status,
                            'Items': intent.lineItems.map(li => `${materials.find(m => m.id === li.materialId)?.name} (${li.quantity} ${li.unit})`).join(', ')
                        }));
                    break;
            }
        }
        setReportData(data);
        setReportHeaders(headers);
    };

    const exportToCsv = () => {
        if (!reportData || reportData.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8," 
            + reportHeaders.join(",") + "\n" 
            + reportData.map(e => Object.values(e).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportType}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPdf = () => {
        if (!reportData || reportData.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [reportHeaders],
            body: reportData.map(row => Object.values(row)),
        });
        doc.save(`${reportType}_report.pdf`);
    };
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as StatusFilterValue;
        setStatusFilter(newStatus);
        if (newStatus === 'pending') {
            setDateFilterType('orderedOn');
        } else if (newStatus === 'delivered') {
            setDateFilterType('deliveredOn');
        }
    };

    const inputClasses = "w-full bg-white border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-sm";
    const labelClasses = "block mb-1.5 text-sm font-medium text-gray-600";
    const isOrderReport = ['total', 'vendor', 'material', 'site'].includes(reportType);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                     <div>
                        <label className={labelClasses}>Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className={inputClasses}>
                            {availableReports.map(type => (
                                <option key={type} value={type}>{reportTypeOptions[type]}</option>
                            ))}
                        </select>
                    </div>
                    
                    {isOrderReport && (
                         <div>
                            <label className={labelClasses}>{t('orderStatusFilter')}</label>
                            <select value={statusFilter} onChange={handleStatusChange} className={inputClasses}>
                                <option value="delivered">{t('delivered')}</option>
                                <option value="pending">{t('pending')}</option>
                                <option value="all">{t('allStatuses')}</option>
                            </select>
                        </div>
                    )}

                    {reportType === 'intent' && (
                         <div>
                            <label className={labelClasses}>{t('intentStatusFilter')}</label>
                            <select value={intentStatusFilter} onChange={e => setIntentStatusFilter(e.target.value as any)} className={inputClasses}>
                                <option value="all">{t('allIntentStatuses')}</option>
                                {Object.values(PurchaseIntentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                     
                    {reportType !== 'inventory' && (
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isOrderReport ? (
                                <div>
                                    <label className={labelClasses}>{t('dateFilterOn')}</label>
                                    <select value={dateFilterType} onChange={e => setDateFilterType(e.target.value as any)} className={inputClasses}>
                                        <option value="deliveredOn" disabled={statusFilter === 'pending'}>{t('deliveredOn')}</option>
                                        <option value="orderedOn">{t('orderedOn')}</option>
                                    </select>
                                </div>
                            ) : <div></div>}
                                
                                <div className={isOrderReport ? "" : "col-span-2"}>
                                    <label className={labelClasses}>{t('filterByDateRange')}</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses} />
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses} min={startDate} />
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}

                    <div className="lg:col-span-4 flex justify-end">
                        <button onClick={generateReport} className="w-full md:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {reportData && (
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="p-6 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900">Report Results</h3>
                        <div className="flex gap-3">
                            <button onClick={exportToCsv} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition text-sm">Export as CSV</button>
                            <button onClick={exportToPdf} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition text-sm">Export as PDF</button>
                        </div>
                    </div>
                    {reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        {reportHeaders.map(header => (
                                            <th key={header} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                                            {reportHeaders.map(header => (
                                                /* FIX: Cast cell content to string to ensure it's a valid React child and prevent potential type errors. */
                                                <td key={header} className="p-4 text-sm text-gray-600 whitespace-pre-wrap">{String(row[header] ?? '')}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center py-16 text-gray-500">
                            <p className="font-medium">No data available for this report.</p>
                            <p className="text-sm">Try adjusting your filters or ensure there are orders matching the criteria in the selected date range.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;