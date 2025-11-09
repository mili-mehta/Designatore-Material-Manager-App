import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-30">
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">
        Designatore
      </h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">{user.name}</span>
              <span className="block text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</span>
            </div>
            <button onClick={onLogout} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;