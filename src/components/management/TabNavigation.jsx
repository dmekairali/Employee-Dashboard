import React from 'react';
import { Zap, DollarSign, Users, MessageSquare, UserPlus } from 'lucide-react';

const tabs = [
  { id: 'quick-analysis', label: 'Quick Analysis', icon: Zap },
  { id: 'fms', label: 'FMS', icon: DollarSign },
  { id: 'delegation', label: 'Delegation', icon: Users },
  { id: 'help-ticket', label: 'Help Ticket', icon: MessageSquare },
  { id: 'help-slip', label: 'Help Slip', icon: UserPlus }
];

const TabNavigation = ({ selectedTab, onTabChange }) => (
  <div className="bg-white rounded-xl shadow-md">
    <div className="border-b border-gray-200">
      <div className="flex space-x-4 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-3 font-semibold text-sm flex items-center space-x-2 transition-colors duration-300 ${
              selectedTab === tab.id
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default TabNavigation;
