import React from 'react';
import { useAuth } from './AuthContext.tsx';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-cyan-400" />
        <span className="font-semibold text-gray-200 text-sm hidden sm:block">{user.name}</span>
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-white bg-gray-700/50 px-3 py-1.5 rounded-md transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
