import React, { useState, useMemo } from 'react';
import { User } from '../types';

const users: User[] = [
  { id: 'u1', name: 'Nidhi', role: 'manager' },
  { id: 'u2', name: 'Shital', role: 'manager' },
  { id: 'u3', name: 'Neyona', role: 'purchaser' },
  { id: 'u4', name: 'Suraj', role: 'purchaser' },
  { id: 'u5', name: 'Praveen', role: 'inventory_manager' },
];

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      onLoginSuccess(user);
    }
  };

  const groupedUsers = useMemo(() => {
    return users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {} as Record<User['role'], User[]>);
  }, []);

  const roleLabels: Record<User['role'], string> = {
    manager: 'Admins',
    purchaser: 'Purchase Managers',
    inventory_manager: 'Inventory Managers',
  };
  
  const roleOrder: User['role'][] = ['manager', 'purchaser', 'inventory_manager'];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Designatore Material Manager
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select a user to log in as
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="user-select" className="sr-only">
                Select User
              </label>
              <select
                id="user-select"
                name="user"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="" disabled>-- Select a user profile --</option>
                {roleOrder.map(role => (
                    groupedUsers[role] && groupedUsers[role].length > 0 && (
                        <optgroup key={role} label={roleLabels[role]}>
                        {groupedUsers[role].map(user => (
                            <option key={user.id} value={user.id}>
                            {user.name}
                            </option>
                        ))}
                        </optgroup>
                    )
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!selectedUserId}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;