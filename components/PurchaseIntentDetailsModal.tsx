import React from 'react';
import { PurchaseIntent, Material, User, PurchaseIntentStatus } from '../types';
import Modal from './Modal';
// FIX: Standardized icon import to use './icons' to resolve filename casing conflict.
import { HandThumbUpIcon, HandThumbDownIcon, ArrowRightCircleIcon } from './icons';

interface PurchaseIntentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  intent: PurchaseIntent;
  materials: Material[];
  currentUser: User;
  onApprove?: (intentId: string) => void;
  onReject?: (intent: PurchaseIntent) => void;
  onCreateOrder?: (intent: PurchaseIntent) => void;
}

const PurchaseIntentDetailsModal: React.FC<PurchaseIntentDetailsModalProps> = ({
  isOpen,
  onClose,
  intent,
  materials,
  currentUser,
  onApprove,
  onReject,
  onCreateOrder,
}) => {
  if (!isOpen) return null;

  const getStatusClass = (status: PurchaseIntentStatus) => {
    switch (status) {
      case PurchaseIntentStatus.Approved: return 'bg-green-100 text-green-700';
      case PurchaseIntentStatus.Pending: return 'bg-yellow-100 text-yellow-700';
      case PurchaseIntentStatus.Rejected: return 'bg-red-100 text-red-700';
      case PurchaseIntentStatus.Converted: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const canApproveReject = currentUser.role === 'manager' && intent.status === PurchaseIntentStatus.Pending && onApprove && onReject;
  const canCreatePO = (currentUser.role === 'manager' || currentUser.role === 'purchaser') && intent.status === PurchaseIntentStatus.Approved && onCreateOrder;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Intent Details: ${intent.id}`}>
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Purchase Intent</h3>
                    <p className="text-sm text-gray-500">Requested by: {intent.requestedBy} on <span className="font-mono">{intent.requestedOn}</span></p>
                </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusClass(intent.status)}`}>
                        {intent.status}
                    </span>
                 </div>
            </div>
            {/* FIX: Replaced non-existent 'rejectedBy' with 'reviewedBy' and adjusted logic based on intent status. */}
            {intent.reviewedBy && (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t border-gray-200 pt-4">
                    <div>
                        <dt className="font-medium text-gray-500">
                            {intent.status === PurchaseIntentStatus.Rejected ? 'Rejected By' : 'Reviewed By'}
                        </dt>
                        <dd className="text-gray-900 font-medium mt-0.5">{intent.reviewedBy} on <span className="font-mono">{intent.reviewedOn}</span></dd>
                    </div>
                </dl>
             )}
        </div>

        {intent.rejectionReason && (
            <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Rejection Reason</h4>
                <p className="p-3 bg-red-50 text-red-800 rounded-md whitespace-pre-wrap text-sm border border-red-200">{intent.rejectionReason}</p>
            </div>
        )}

        {/* Line Items Table */}
        <div>
            <h4 className="text-base font-semibold text-gray-700 mb-2">Requested Items</h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="p-3 font-semibold text-gray-600">Material</th>
                            <th className="p-3 font-semibold text-gray-600 text-right">Qty</th>
                            <th className="p-3 font-semibold text-gray-600">Site</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {intent.lineItems.map(item => {
                            const material = materials.find(m => m.id === item.materialId);
                            return(
                                <tr key={item.id}>
                                    <td className="p-3 align-top">
                                        <div className="font-medium text-gray-800">{material?.name}</div>
                                        {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
                                    </td>
                                    <td className="p-3 text-right font-mono align-top">{item.quantity} {item.unit}</td>
                                    <td className="p-3 align-top">{item.site || 'N/A'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {intent.notes && (
            <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Overall Notes</h4>
                <p className="p-3 bg-gray-50 rounded-md text-gray-700 whitespace-pre-wrap text-sm border border-gray-200">{intent.notes}</p>
            </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
             <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition"
                >
                Close
            </button>
            <div className="flex items-center gap-3">
                {canApproveReject && (
                    <>
                        <button
                            type="button"
                            onClick={() => onReject?.(intent)}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition shadow-sm flex items-center gap-2"
                        >
                            <HandThumbDownIcon className="w-5 h-5" />
                            Reject
                        </button>
                         <button
                            type="button"
                            onClick={() => onApprove?.(intent.id)}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition shadow-sm flex items-center gap-2"
                        >
                            <HandThumbUpIcon className="w-5 h-5" />
                            Approve
                        </button>
                    </>
                )}
                 {canCreatePO && (
                     <button
                        type="button"
                        onClick={() => onCreateOrder?.(intent)}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-md text-white font-semibold transition shadow-sm flex items-center gap-2"
                    >
                        Create Purchase Order
                        <ArrowRightCircleIcon className="w-5 h-5" />
                    </button>
                 )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseIntentDetailsModal;