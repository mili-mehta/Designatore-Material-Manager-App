import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

// Mock users for development/preview environments where Firebase auth is restricted.
const MOCK_USERS: User[] = [
    // Managers
    {
      uid: 'mock-manager-uid-001',
      name: 'Nidhi Patel (Manager)',
      email: 'nidhi.patel100474@gmail.com',
      role: 'manager',
    },
    {
      uid: 'mock-manager-uid-shital',
      name: 'Shital (Manager)',
      email: 'shital@example.com',
      role: 'manager',
    },
    // Purchasers
    {
      uid: 'mock-purchaser-uid-neyona',
      name: 'Neyona (Purchase Manager)',
      email: 'neyona@example.com',
      role: 'purchaser',
    },
    {
      uid: 'mock-purchaser-uid-suraj',
      name: 'Suraj (Purchase Manager)',
      email: 'suraj@example.com',
      role: 'purchaser',
    },
    // Inventory Managers
    {
      uid: 'mock-inventory-uid-praveen',
      name: 'Praveen (Inventory Manager)',
      email: 'praveen@example.com',
      role: 'inventory_manager',
    },
];


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function now simulates a login by calling the onLoginSuccess callback
  // with a specific user object.
  const handleMockLogin = (user: User) => {
    setIsLoading(true);
    setError(null);

    // Simulate a network request delay
    setTimeout(() => {
      onLoginSuccess(user);
      setIsLoading(false);
    }, 500);
  };
  
  const usersByRole = MOCK_USERS.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<User['role'], User[]>);

  const roleOrder: User['role'][] = ['manager', 'purchaser', 'inventory_manager'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Designatore</h1>
          <p className="text-gray-500 mt-2">Material Management</p>
        </div>
        <div className="p-8 space-y-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Welcome</h2>
            <p className="text-sm text-gray-500 mt-1">Please select a user to sign in.</p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md mt-4">
              <strong>Note:</strong> Live authentication is disabled in this preview.
            </p>
          </div>
          
          {error && <p className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
          
          <div className="space-y-4">
            {roleOrder.map(role => (
              usersByRole[role] && <div key={role}>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 capitalize">{role.replace('_', ' ')}s</h3>
                <div className="space-y-2">
                  {usersByRole[role].map(user => (
                    <button
                      key={user.uid}
                      onClick={() => handleMockLogin(user)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-gray-500">
              Access is restricted. Only authorized Google accounts will be granted access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;