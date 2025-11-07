import React, { useState } from 'react';
import Modal from './Modal';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, onClose, onSubmit, title }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    onSubmit(reason);
  };
  
  const inputClasses = "w-full bg-gray-100 border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition shadow-sm";
  const labelClasses = "block mb-1.5 text-sm font-medium text-gray-600";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rejectionReason" className={labelClasses}>
            Reason for Rejection
          </label>
          <textarea
            id="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${inputClasses} min-h-[100px]`}
            placeholder="Provide a clear reason for rejecting this item..."
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-md text-gray-800 font-semibold transition">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition shadow-sm">
            Confirm Rejection
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectionModal;