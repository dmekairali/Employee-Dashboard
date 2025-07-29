import React from 'react';
import { X, User, Clock, LogOut, Briefcase } from 'lucide-react';

const UserProfileModal = ({ user, loginTime, onLogout, onClose }) => {
  const getReadableLoginTime = () => {
    if (!loginTime) return 'N/A';
    return new Date(parseInt(loginTime, 10)).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <div className="p-6 border-b border-border-color flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Profile</h2>
          <button onClick={onClose} className="text-sidebar-foreground hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-4xl">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground">{user.name}</h3>
          <p className="text-sidebar-foreground">{user.email}</p>
        </div>
        <div className="bg-background rounded-b-2xl p-6 space-y-4">
          <div className="flex items-center space-x-4 p-3 bg-card-background rounded-lg">
            <Briefcase className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-sidebar-foreground">Role</p>
              <p className="font-semibold text-foreground">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-3 bg-card-background rounded-lg">
            <Clock className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-sidebar-foreground">Logged In At</p>
              <p className="font-semibold text-foreground">{getReadableLoginTime()}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300"
          >
            <LogOut className="w-5 h-5 inline mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
