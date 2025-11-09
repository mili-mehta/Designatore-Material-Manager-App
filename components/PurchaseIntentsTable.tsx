import React from 'react';
import { PurchaseIntent, PurchaseIntentStatus, Material, User } from '../types';
// FIX: Updated icon import path to './icons' to resolve a filename casing conflict.
import { HandThumbUpIcon, HandThumbDownIcon, ArrowRightCircleIcon } from './icons';

interface PurchaseIntentsTableProps {
  title: string;
  intents: PurchaseIntent[];
  materials: Material[];
  currentUser: User;
  onApprove?: (intentId: string) => void;
  onReject?: (intent: PurchaseIntent) => void;
  onCreateOrder?: (intent: PurchaseIntent) => void;
}

const PurchaseIntentsTable: React.FC<PurchaseIntentsTableProps> = ({ title, intents, materials, currentUser, onApprove, onReject, onCreateOrder }) => {
  const { role: currentUserRole } = currentUser;

  const getStatusClass = (status: PurchaseIntentStatus) => {
    switch (status) {
      case PurchaseIntentStatus.Approved: return 'bg-green-100 text-green-700';
      case PurchaseIntentStatus.Pending: return 'bg-yellow-100 text-yellow-700';
      case PurchaseIntentStatus.Rejected: return 'bg-red-100 text-red-700';
      case PurchaseIntentStatus.Converted: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intent Details</th>
              {currentUserRole === 'purchaser' && <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested By</th>}
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested On</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((intent) => {
              const firstMaterial = materials.find(m => m.id === intent.lineItems[0]?.materialId);
              return (
                <tr key={intent.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{firstMaterial?.name}</div>
                    {intent.lineItems.length > 1 && <div className="text-sm text-gray-500">+ {intent.lineItems.length - 1} more items</div>}
                    <div className="text-xs text-gray-400 font-mono mt-1">{intent.id}</div>
                    {intent.notes && <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={intent.notes}>Reason: {intent.notes}</div>}
                    {intent.status === PurchaseIntentStatus.Rejected && intent.rejectionReason && <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={intent.rejectionReason}>Rejection: {intent.rejectionReason}</div>}
                  </td>
                  {currentUserRole === 'purchaser' && <td className="p-4 text-sm text-gray-600">{intent.requestedBy}</td>}
                  <td className="p-4 text-sm font-mono text-gray-600">{intent.requestedOn}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusClass(intent.status)}`}>{intent.status}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {currentUserRole === 'purchaser' && (
                        <>
                          {intent.status === PurchaseIntentStatus.Pending && onApprove && onReject && (
                            <>
                              <button onClick={() => onApprove(intent.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition shadow-sm">
                                <HandThumbUpIcon className="w-4 h-4" /> Approve
                              </button>
                              <button onClick={() => onReject(intent)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition shadow-sm">
                                <HandThumbDownIcon className="w-4 h-4" /> Reject
                              </button>
                            </>
                          )}
                          {intent.status === PurchaseIntentStatus.Approved && onCreateOrder && (
                            <button onClick={() => onCreateOrder(intent)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition shadow-sm">
                              <ArrowRightCircleIcon className="w-4 h-4" /> Create PO
                            </button>
                          )}
                        </>
                      )}
                      {(!onApprove && !onCreateOrder) && <span className="text-xs text-gray-400">-</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
         {intents.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <p className="font-medium">No purchase intents here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseIntentsTable;