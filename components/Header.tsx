import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
        Designatore
      </h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">{user.name}</span>
              <span className="block text-xs text-gray-500 capitalize">{user.role}</span>
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