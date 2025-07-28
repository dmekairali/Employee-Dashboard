import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Home,
  BarChart3,
  FileText,
  MessageSquare,
  Plus,
  Filter,
  Download,
  ArrowRight,
  ExternalLink,
  UserPlus,
  AlertTriangle,
  Ticket,
  Mail,
  Phone,
  Clipboard
} from 'lucide-react';
import NotificationsAnnouncements from './NotificationsAnnouncements';
import DelegationTasks from './DelegationTasks';
import FMSTasks from './FMSTasks';
import HTTasks from './HTTasks';
import PCTasks from './PCTasks';
import HSHelpSlip from './HSHelpSlip';
import AdminNotifications from './AdminNotifications';
import NewTaskNotification from './NewTaskNotification';
import Overview from './Overview';
import dataManager from '../utils/DataManager';
import TimeDisplay from './TimeDisplay';

const EmployeeDashboard = ({ currentUser, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('notifications'); // Changed default to overview
  const [notifications, setNotifications] = useState(6);
  const [newTaskNotifications, setNewTaskNotifications] = useState([]);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Setup new task notifications
  useEffect(() => {
    if (currentUser) {
      const handleNewTasks = (notification) => {
        console.log('New tasks detected:', notification);

        setNewTaskNotifications(prev => {
          // Check if we already have a notification for this component
          const existingIndex = prev.findIndex(n => n.component === notification.component);
          
          if (existingIndex >= 0) {
            // Update existing notification
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              count: updated[existingIndex].count + notification.count,
              newTasks: [...updated[existingIndex].newTasks, ...notification.newTasks]
            };
            return updated;
          } else {
            // Add new notification
            return [...prev, notification];
          }
        });
        console.log('Setting modal to show');
        
        // Show modal if there are new tasks
        setShowNewTaskModal(true);
        
        // Update notification badge count
        setNotifications(prev => prev + notification.count);
      };

      console.log('Registering callback for user:', currentUser.name);

      dataManager.registerNewTaskCallback(currentUser.name, handleNewTasks);

      return () => {
        dataManager.unregisterNewTaskCallback(currentUser.name);
      };
    }
  }, [currentUser]);

  // Cleanup on logout
  useEffect(() => {
    return () => {
      if (currentUser) {
        dataManager.stopAutoRefresh('delegation', currentUser.name);
        dataManager.stopAutoRefresh('fms', currentUser.name);
        dataManager.stopAutoRefresh('ht', currentUser.name);
        dataManager.stopAutoRefresh('pc', currentUser.name);
        dataManager.stopAutoRefresh('hs', currentUser.name);
      }
    };
  }, [currentUser]);

  const handleCloseNewTaskModal = () => {
    setShowNewTaskModal(false);
  };

  const handleMarkAllRead = () => {
    setNewTaskNotifications([]);
    setNotifications(6); // Reset to base count
    setShowNewTaskModal(false);
  };

  // Function to handle tab changes - this will be passed to Overview
  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
  };

  // Role-based navigation items
  const getNavigationItems = (permissions) => {
    const allItems = [
      
      { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'canViewOverview' },
      { id: 'overview', label: 'Overview', icon: Home, permission: 'canViewOverview' },
      { id: 'ht-tasks', label: 'HT Tasks', icon: UserPlus, permission: 'canViewHT' },
      { id: 'delegation', label: 'Delegation', icon: Users, permission: 'canViewDelegation' },
      { id: 'fms', label: 'FMS', icon: FileText, permission: 'canViewFMS' },
      { id: 'pc', label: 'PC Dashboard', icon: Clipboard, permission: 'canViewPC' },
      { id: 'hs', label: 'HelpSlip', icon: UserPlus, permission: 'canViewHS' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'canViewAnalytics' },
      { id: 'admin', label: 'Admin', icon: Settings, permission: 'canViewAdmin' },
    ];

    return allItems.filter(item => permissions[item.permission]);
  };

  const navigationItems = getNavigationItems(currentUser.permissions);

  // Ensure selected tab is valid for current user
  useEffect(() => {
    const validTabs = navigationItems.map(item => item.id);
    if (!validTabs.includes(selectedTab)) {
      setSelectedTab('overview'); // Default fallback to overview
    }
  }, [currentUser, navigationItems, selectedTab]);

  const getRoleColor = (role) => {
    const colors = {
      'Operation': 'from-blue-500 to-blue-600',
      'PC': 'from-green-500 to-green-600',
      'Sales Agent': 'from-purple-500 to-purple-600',
      'Medical Representative': 'from-red-500 to-red-600',
      'HR': 'from-yellow-500 to-yellow-600',
      'Account': 'from-indigo-500 to-indigo-600'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kairali</h1>
              <p className="text-sm text-gray-500">TaskApp Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                selectedTab === item.id 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{currentUser.name}</p>
              <p className="text-sm text-gray-500">{currentUser.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTab === 'notifications' ? 'Notifications & Announcements' :
                 selectedTab === 'overview' ? 'Dashboard Overview' :
                 selectedTab === 'ht-tasks' ? 'Help Tickets' :
                 selectedTab === 'delegation' ? 'Delegation Tasks' :
                 selectedTab === 'fms' ? 'FMS Tasks' :
                 selectedTab === 'pc' ? 'PC Dashboard' :
                 selectedTab === 'hs' ? 'Help Slips' :
                 selectedTab === 'analytics' ? 'Analytics' :
                 selectedTab === 'admin' ? 'Admin Panel' :
                 'Dashboard'}
              </h2>
              <p className="text-gray-600">
                {selectedTab === 'overview' 
                  ? `Welcome back, ${currentUser.name.split(' ')[0]} • ${currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} • ${currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}`
                  : `${currentUser.role} • ${currentUser.department}`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets, tasks..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications > 99 ? '99+' : notifications}
                  </span>
                )}
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
         

          {selectedTab === 'notifications' && (
            <NotificationsAnnouncements currentUser={currentUser} />
          )}

           {/* Conditional Content Based on Selected Tab */}
          {selectedTab === 'overview' && (
            <Overview currentUser={currentUser} onTabChange={handleTabChange} />
          )}

          {/* Delegation Full Page */}
          {selectedTab === 'delegation' && currentUser.permissions.canViewDelegation && (
            <DelegationTasks currentUser={currentUser} />
          )}

          {/* HT Tasks Full Page */}
          {selectedTab === 'ht-tasks' && currentUser.permissions.canViewHT && (
            <HTTasks currentUser={currentUser} />
          )}

          {/* FMS Full Page */}
          {selectedTab === 'fms' && currentUser.permissions.canViewFMS && (
            <FMSTasks currentUser={currentUser} />
          )}

          {/* PC Full Page */}
          {selectedTab === 'pc' && currentUser.permissions.canViewPC && (
            <PCTasks currentUser={currentUser} />
          )}
          
          {/* HS Full Page */}
          {selectedTab === 'hs' && currentUser.permissions.canViewHS && (
            <HSHelpSlip currentUser={currentUser} />
          )}

          {/* Analytics Full Page */}
          {selectedTab === 'analytics' && currentUser.permissions.canViewAnalytics && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
              <p className="text-gray-600">Analytics component will be implemented here.</p>
            </div>
          )}

          {/* Admin Full Page */}
          {selectedTab === 'admin' && currentUser.permissions.canViewAdmin && (
            <AdminNotifications currentUser={currentUser} />
          )}

          {/* Fallback for unauthorized admin access */}
          {selectedTab === 'admin' && !currentUser.permissions.canViewAdmin && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to access the Admin panel.</p>
                <p className="text-gray-500 text-sm mt-2">Contact your administrator to request Admin access.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Task Notification Modal */}
      {showNewTaskModal && newTaskNotifications.length > 0 && (
        <NewTaskNotification 
          notifications={newTaskNotifications}
          onClose={handleCloseNewTaskModal}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
