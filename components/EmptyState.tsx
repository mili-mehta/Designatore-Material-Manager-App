import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
    </div>
  );
};

export default EmptyState;
