import React from 'react';
import ReactDOM from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { AppNotification } from '../types';
// FIX: Standardized icon import to use './icons' (lowercase) to resolve filename casing conflict.
import { CheckCircleIcon, AlertTriangleIcon, InformationCircleIcon, XMarkIcon } from './icons';

const Notification: React.FC<{ notification: AppNotification; onDismiss: (id: number) => void; }> = ({ notification, onDismiss }) => {
  const { type, message, id } = notification;

  const baseClasses = "flex items-start p-4 w-full max-w-sm bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5";
  
  const typeConfig = {
    success: {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      style: "text-green-800"
    },
    warning: {
      icon: <AlertTriangleIcon className="h-6 w-6 text-amber-500" />,
      style: "text-amber-800"
    },
    danger: {
      icon: <AlertTriangleIcon className="h-6 w-6 text-red-500" />,
      style: "text-red-800"
    },
    info: {
      icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
      style: "text-blue-800"
    }
  };

  return (
    <div className={baseClasses}>
        <div className="flex-shrink-0">
            {typeConfig[type].icon}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${typeConfig[type].style}`}>{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
            <button onClick={() => onDismiss(id)} className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    </div>
  );
};

const NotificationCenter = () => {
    const { notifications, dismissNotification } = useAppContext();
    const portalRoot = document.getElementById('notifications-root');

    if (!portalRoot) {
        return null;
    }

    return ReactDOM.createPortal(
        <div
        aria-live="assertive"
        className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
            {notifications.map((n) => (
                <Notification key={n.id} notification={n} onDismiss={dismissNotification} />
            ))}
        </div>
        </div>,
        portalRoot
    );
};

export default NotificationCenter;