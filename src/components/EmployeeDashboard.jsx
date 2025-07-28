import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [notifications, setNotifications] = useState(6);
  const [newTaskNotifications, setNewTaskNotifications] = useState([]);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  // State for pending counts
  const [pendingCounts, setPendingCounts] = useState({
    ht: 0,
    delegation: 0,
    fms: 0,
    pc: 0,
    hs: 0
  });

  // Function to calculate pending counts from cached data
  const calculatePendingCounts = useMemo(() => {
    return () => {
      const counts = {
        ht: 0,
        delegation: 0,
        fms: 0,
        pc: 0,
        hs: 0
      };

      try {
        // HT Tasks - Reply pending (assigned to user)
        if (currentUser.permissions.canViewHT) {
          const htData = dataManager.getDataWithFallback('ht', currentUser.name);
          const htRaisedOnYou = htData.filter(task => task.issueDelegatedTo === currentUser.name);
          counts.ht = htRaisedOnYou.filter(task => 
            (!task.replyActual || task.replyActual.trim() === '')
          ).length;
        }

        // Delegation Tasks - Pending status
        if (currentUser.permissions.canViewDelegation) {
          const delegationData = dataManager.getDataWithFallback('delegation', currentUser.name);
          counts.delegation = delegationData.filter(task => 
            (task.delegation_status || 'pending').toLowerCase().includes('pending')
          ).length;
        }

        // FMS Tasks - Overdue/Delayed tasks
        if (currentUser.permissions.canViewFMS) {
          const fmsData = dataManager.getDataWithFallback('fms', currentUser.name);
          counts.fms = fmsData.filter(task => task.delay && task.delay.trim() !== '').length;
        }

        // PC Tasks - Overdue tasks
        if (currentUser.permissions.canViewPC) {
          const pcData = dataManager.getDataWithFallback('pc', currentUser.name);
          counts.pc = pcData.filter(task => {
            const delay = task.delay || '';
            return delay && delay.trim() !== '';
          }).length;
        }

        // HS Tasks - Reply pending for user
        if (currentUser.permissions.canViewHS) {
          const hsData = dataManager.getDataWithFallback('hs', currentUser.name);
          const userHSData = hsData.filter(task => 
            task.name === currentUser.name || task.assignedTo === currentUser.name
          );
          counts.hs = userHSData.filter(task => 
            task.replyPlanned && task.replyPlanned.trim() !== '' &&
            (!task.replyActual || task.replyActual.trim() === '')
          ).length;
        }

      } catch (error) {
        console.error('Error calculating pending counts:', error);
      }

      return counts;
    };
  }, [currentUser.name, currentUser.permissions]);

  // Update pending counts every 2 minutes
  useEffect(() => {
    const updateCounts = () => {
      const newCounts = calculatePendingCounts();
      setPendingCounts(newCounts);
      console.log('Updated pending counts:', newCounts);
    };

    // Initial update
    updateCounts();

    // Set up interval for every 2 minutes (120,000 ms)
    const interval = setInterval(updateCounts, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [calculatePendingCounts]);

  // Also update counts when cache data changes (immediate updates)
  useEffect(() => {
    const updateCounts = () => {
      const newCounts = calculatePendingCounts();
      setPendingCounts(newCounts);
    };

    // Listen for cache updates
    const checkInterval = setInterval(updateCounts, 10000); // Check every 10 seconds for immediate updates

    return () => clearInterval(checkInterval);
  }, [calculatePendingCounts]);

  // Setup new task notifications
  useEffect(() => {
    if (currentUser) {
      const handleNewTasks = (notification) => {
        console.log('New tasks detected:', notification);

        setNewTaskNotifications(prev => {
          const existingIndex = prev.findIndex(n => n.component === notification.component);
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              count: updated[existingIndex].count + notification.count,
              newTasks: [...updated[existingIndex].newTasks, ...notification.newTasks]
            };
            return updated;
          } else {
            return [...prev, notification];
          }
        });
        
        setShowNewTaskModal(true);
        setNotifications(prev => prev + notification.count);
      };

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
    setNotifications(6);
    setShowNewTaskModal(false);
  };

  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
  };

  // Component to render count badge
  const CountBadge = ({ count, type = 'default' }) => {
    if (!count || count === 0) return null;

    const badgeStyles = {
      default: 'bg-blue-500 text-white',
      urgent: 'bg-red-500 text-white',
      warning: 'bg-orange-500 text-white',
      success: 'bg-green-500 text-white'
    };

    const getBadgeType = (count) => {
      if (count > 10) return 'urgent';
      if (count > 5) return 'warning';
      return 'default';
    };

    const badgeType = type === 'default' ? getBadgeType(count) : type;

    return (
      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${badgeStyles[badgeType]} ml-auto animate-pulse`}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Role-based navigation items with counts
  const getNavigationItems = (permissions) => {
    const allItems = [
      { 
        id: 'notifications', 
        label: 'Notifications', 
        icon: Bell, 
        permission: 'canViewOverview',
        count: 0 // Notifications don't need pending count
      },
      { 
        id: 'overview', 
        label: 'Overview', 
        icon: Home, 
        permission: 'canViewOverview',
        count: 0 // Overview doesn't need pending count
      },
      { 
        id: 'ht-tasks', 
        label: 'HT Tasks', 
        icon: UserPlus, 
        permission: 'canViewHT',
        count: pendingCounts.ht
      },
      { 
        id: 'delegation', 
        label: 'Delegation', 
        icon: Users, 
        permission: 'canViewDelegation',
        count: pendingCounts.delegation
      },
      { 
        id: 'fms', 
        label: 'FMS', 
        icon: FileText, 
        permission: 'canViewFMS',
        count: pendingCounts.fms
      },
      { 
        id: 'pc', 
        label: 'PC Dashboard', 
        icon: Clipboard, 
        permission: 'canViewPC',
        count: pendingCounts.pc
      },
      { 
        id: 'hs', 
        label: 'HelpSlip', 
        icon: UserPlus, 
        permission: 'canViewHS',
        count: pendingCounts.hs
      },
      { 
        id: 'analytics', 
        label: 'Analytics', 
        icon: BarChart3, 
        permission: 'canViewAnalytics',
        count: 0 // Analytics doesn't need pending count
      },
      { 
        id: 'admin', 
        label: 'Admin', 
        icon: Settings, 
        permission: 'canViewAdmin',
        count: 0 // Admin doesn't need pending count
      },
    ];

    return allItems.filter(item => permissions[item.permission]);
  };

  const navigationItems = getNavigationItems(currentUser.permissions);

  // Ensure selected tab is valid for current user
  useEffect(() => {
    const validTabs = navigationItems.map(item => item.id);
    if (!validTabs.includes(selectedTab)) {
      setSelectedTab('overview');
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

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                selectedTab === item.id 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              
              {/* Count Badge */}
              <CountBadge count={item.count} />
            </button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          {/* Cache Status Indicator */}
          <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Cache Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>

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
                  ? <TimeDisplay />
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

          {selectedTab === 'overview' && (
            <Overview currentUser={currentUser} onTabChange={handleTabChange} />
          )}

          {selectedTab === 'delegation' && currentUser.permissions.canViewDelegation && (
            <DelegationTasks currentUser={currentUser} />
          )}

          {selectedTab === 'ht-tasks' && currentUser.permissions.canViewHT && (
            <HTTasks currentUser={currentUser} />
          )}

          {selectedTab === 'fms' && currentUser.permissions.canViewFMS && (
            <FMSTasks currentUser={currentUser} />
          )}

          {selectedTab === 'pc' && currentUser.permissions.canViewPC && (
            <PCTasks currentUser={currentUser} />
          )}
          
          {selectedTab === 'hs' && currentUser.permissions.canViewHS && (
            <HSHelpSlip currentUser={currentUser} />
          )}

          {selectedTab === 'analytics' && currentUser.permissions.canViewAnalytics && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
              <p className="text-gray-600">Analytics component will be implemented here.</p>
            </div>
          )}

          {selectedTab === 'admin' && currentUser.permissions.canViewAdmin && (
            <AdminNotifications currentUser={currentUser} />
          )}

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
