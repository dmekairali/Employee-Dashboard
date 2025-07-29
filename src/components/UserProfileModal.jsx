import React from 'react';
import { X, User, Clock, LogOut } from 'lucide-react';

const UserProfileModal = ({ user, loginTime, onLogout, onClose }) => {
  const getReadableLoginTime = () => {
    if (!loginTime) return 'N/A';
    return new Date(parseInt(loginTime, 10)).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card-background rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">User Profile</h2>
          <button onClick={onClose} className="text-sidebar-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-sidebar-foreground" />
            <span className="text-foreground">{user.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-sidebar-foreground" />
            <span className="text-foreground">Logged in at: {getReadableLoginTime()}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-6 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 inline mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfileModal;
