// Updated EmployeeDashboard.jsx with Notification Counter and Checklist Tab
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
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
  Clipboard,
  Gauge, // Added for Management Dashboard
  Shield,  // Added for Management Dashboard
  Sun,
  Moon,
  Briefcase,
  X,
  CheckSquare, // Added for Checklist
  Menu
} from 'lucide-react';
import NotificationsAnnouncements from './NotificationsAnnouncements';
import DelegationTasks from './DelegationTasks';
import FMSTasks from './FMSTasks';
import HTTasks from './HTTasks';
import PCTasks from './PCTasks';
import HSHelpSlip from './HSHelpSlip';
import AdminNotifications from './AdminNotifications';
import ManagementDashboard from './ManagementDashboard'; // Import the new component
import ChecklistTasks from './ChecklistTasks'; // Import Checklist component
import NewTaskNotification from './NewTaskNotification';
import Overview from './Overview';
import dataManager from '../utils/DataManager';
import TimeDisplay from './TimeDisplay';
import LoginTimer from './LoginTimer';
import { useNotificationCounter } from '../hooks/useNotificationCounter';

const EmployeeDashboard = ({ currentUser, onLogout, loginTime }) => {
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [notifications, setNotifications] = useState(6);
  const [newTaskNotifications, setNewTaskNotifications] = useState([]);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification counter hook
  const { unreadTodayCount } = useNotificationCounter(currentUser);
  
  // State for pending counts - Updated to include checklist
  const [pendingCounts, setPendingCounts] = useState({
    ht: 0,
    delegation: 0,
    fms: 0,
    pc: 0,
    hs: 0,
    checklist: 0 // Added checklist count
  });

  // Calculate pending counts based on cached data - Updated to include checklist
  const calculatePendingCounts = useMemo(() => {
    return () => {
      const counts = { ht: 0, delegation: 0, fms: 0, pc: 0, hs: 0, checklist: 0 };
      
      try {
        // Get data from cache
        const delegationData = dataManager.getDataWithFallback('delegation', currentUser.name);
        const fmsData = dataManager.getDataWithFallback('fms', currentUser.name);
        const htData = dataManager.getDataWithFallback('ht', currentUser.name);
        const pcData = dataManager.getDataWithFallback('pc', currentUser.name);
        const hsData = dataManager.getDataWithFallback('hs', currentUser.name);

        // Count pending delegation tasks
        if (currentUser.permissions.canViewDelegation) {
          counts.delegation = delegationData.filter(task => 
            (task.delegation_status || 'pending').toLowerCase().includes('pending')
          ).length;
        }

        // Count pending FMS tasks
        if (currentUser.permissions.canViewFMS) {
          counts.fms = fmsData.filter(task => {
            const delay = parseFloat(task.delay || 0);
            return delay > 0; // Tasks with positive delay are considered pending/overdue
          }).length;
        }

        // Count pending PC tasks
        if (currentUser.permissions.canViewPC) {
          counts.pc = pcData.filter(task => {
            const delay = parseFloat(task.delay || 0);
            return delay > 0;
          }).length;
        }

        // Count checklist tasks assigned to current user as Doer
        if (currentUser.permissions.canViewFMS) { // Use same permission as FMS since it's same data source
          const checklistTasks = fmsData.filter(task => {
            // Filter for checklist tasks where current user is the Doer
            const fmsType = task.fms || '';
            const isChecklistTask = fmsType.toLowerCase().includes('checklist task');
            const taskDoer = task.doer || task.assignedTo || '';
            const isUserDoer = taskDoer === currentUser.name;
            
            return isChecklistTask && isUserDoer;
          });
          
          // Count ALL checklist tasks (not just overdue ones)
          counts.checklist = checklistTasks.length;
        }

        // Count pending HT tasks (tasks raised on this user awaiting reply)
        if (currentUser.permissions.canViewHT) {
          const htRaisedOnYou = htData.filter(task => task.issueDelegatedTo === currentUser.name);
          counts.ht = htRaisedOnYou.filter(task => 
            (!task.replyActual || task.replyActual.trim() === '')
          ).length;
        }

        // Count pending HS tasks
        if (currentUser.permissions.canViewHS) {
          // Check if user is director
          const isDirector = 
            (currentUser?.role?.toLowerCase() === 'director') || 
            (currentUser?.department?.toLowerCase() === 'director');
          
          if (isDirector) {
            // Directors: count all help slips awaiting director's reply
            counts.hs = hsData.filter(task => 
              task.helpSlipId && task.helpSlipId.trim() !== '' &&
              (!task.replyActual || task.replyActual.trim() === '')
            ).length;
          } else {
            // Regular users: count only their own pending tasks
            const userHSData = hsData.filter(task => 
              task.name === currentUser.name || task.assignedTo === currentUser.name
            );
            counts.hs = userHSData.filter(task => 
              task.replyPlanned && task.replyPlanned.trim() !== '' &&
              (!task.replyActual || task.replyActual.trim() === '')
            ).length;
          }
        }

      } catch (error) {
        console.error('Error calculating pending counts:', error);
      }

      return counts;
    };
  }, [currentUser.name, currentUser.permissions]);

  // Update pending counts every 30 seconds
  useEffect(() => {
    const updateCounts = () => {
      const newCounts = calculatePendingCounts();
      setPendingCounts(newCounts);
    };

    // Initial update
    updateCounts();

    // Set up interval for every 30 seconds
    const interval = setInterval(updateCounts, 30 * 1000);

    return () => clearInterval(interval);
  }, [calculatePendingCounts]);

  // Setup new task notifications
  useEffect(() => {
    if (currentUser) {
      const handleNewTasks = (notification) => {
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
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Component to render count badge (original styling preserved)
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

  // Special badge for notifications only
  const NotificationBadge = ({ count }) => {
    if (!count || count === 0) return null;

    return (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full bg-red-500 text-white animate-pulse ml-auto">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Check if user is management level
  const isManagementUser = () => {
    const managementRoles = ['director', 'manager', 'ceo', 'cto', 'admin','ea'];
    const userRole = (currentUser.role || '').toLowerCase();
    const userDepartment = (currentUser.department || '').toLowerCase();
    
    return managementRoles.some(role => 
      userRole.includes(role) || userDepartment.includes(role)
    ) || currentUser.permissions.canViewAdmin;
  };

  // Role-based navigation items with counts - Updated to include Checklist
  const getNavigationItems = (permissions) => {
    const allItems = [
      { 
        id: 'notifications', 
        label: 'Notifications', 
        icon: Bell, 
        permission: 'canViewOverview',
        count: unreadTodayCount,
        isNotification: true
      },
      { 
        id: 'overview', 
        label: 'Overview', 
        icon: Home, 
        permission: 'canViewOverview',
        count: 0
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
      // Add Checklist tab here
      { 
        id: 'checklist', 
        label: 'Checklist', 
        icon: CheckSquare, 
        permission: 'canViewFMS', // Use same permission as FMS since it's same data source
        count: pendingCounts.checklist
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
        count: 0
      },
      // Management Dashboard - Only show for management users
      ...(isManagementUser() ? [{
        id: 'management', 
        label: 'Management', 
        icon: Gauge, 
        permission: 'canViewAdmin',
        count: 0,
        special: true
      }] : []),
      { 
        id: 'admin', 
        label: 'Admin', 
        icon: Settings, 
        permission: 'canViewAdmin',
        count: 0
      },
    ];

    // Filter items based on permissions, but always show management for management users
    return allItems.filter(item => {
      if (item.id === 'management') {
        return isManagementUser();
      }
      return permissions[item.permission];
    });
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
      'Account': 'from-indigo-500 to-indigo-600',
      'Director': 'from-red-600 to-purple-600',
      'Manager': 'from-purple-600 to-indigo-600',
      'CEO': 'from-gold-500 to-yellow-600',
      'Admin': 'from-gray-600 to-gray-700'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  // Get page title based on selected tab - Updated to include Checklist
  const getPageTitle = () => {
    switch (selectedTab) {
      case 'notifications': return 'Notifications & Announcements';
      case 'overview': return 'Dashboard Overview';
      case 'ht-tasks': return 'Help Tickets';
      case 'delegation': return 'Delegation Tasks';
      case 'fms': return 'FMS Tasks';
      case 'pc': return 'PC Dashboard';
      case 'checklist': return 'Checklist Tasks'; // Added checklist title
      case 'hs': return 'Help Slips';
      case 'analytics': return 'Analytics';
      case 'management': return 'Management Command Center';
      case 'admin': return 'Admin Panel';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-border-color z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Kairali</h1>
              <p className="text-sm text-sidebar-foreground">TaskApp Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                selectedTab === item.id 
                  ? item.special 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-r-2 border-purple-600' 
                    : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-sidebar-foreground hover:bg-gray-50 hover:text-gray-900'
              } ${item.special ? 'font-semibold' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 ${item.special ? 'text-purple-600' : ''}`} />
                <span className="font-medium text-foreground">{item.label}</span>
                {item.special && (
                  <Shield className="w-4 h-4 text-purple-500" />
                )}
              </div>
              
              {/* Count Badge - Use special notification badge for notifications */}
              {item.isNotification ? (
                <NotificationBadge count={item.count} />
              ) : (
                <CountBadge count={item.count} />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border-color">
          {/* Cache Status Indicator */}
          <div className="mb-3 px-4 py-2 bg-background rounded-lg">
            <div className="flex items-center justify-between text-xs text-sidebar-foreground">
              <span>Cache Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
            <div className="text-xs text-sidebar-foreground mt-1">
              Last update: {new Date().toLocaleTimeString()}
            </div>
            <LoginTimer loginTime={loginTime} />
          </div>

          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-background cursor-pointer">
            <div className={`w-8 h-8 bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-full flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{currentUser.name}</p>
              <p className="text-sm text-sidebar-foreground">
                {currentUser.role}
                {isManagementUser() && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                    MGMT
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="p-1 text-sidebar-foreground hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-card-background border-b border-border-color px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 mr-2 text-sidebar-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center">
                  {selectedTab === 'management' && (
                    <Gauge className="w-6 h-6 mr-3 text-purple-600 hidden md:block" />
                  )}
                  {selectedTab === 'checklist' && (
                    <CheckSquare className="w-6 h-6 mr-3 text-green-600 hidden md:block" />
                  )}
                  {getPageTitle()}
                  {selectedTab === 'management' && (
                    <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-semibold hidden lg:block">
                      EXECUTIVE
                    </span>
                  )}
                </h2>
                <p className="text-sidebar-foreground text-sm hidden md:block">
                  {selectedTab === 'overview'
                    ? <TimeDisplay />
                    : selectedTab === 'management'
                    ? 'Real-time organizational insights and performance analytics'
                    : selectedTab === 'checklist'
                    ? `Checklist tasks assigned to ${currentUser.name} as Doer`
                    : `${currentUser.role} • ${currentUser.department}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder={selectedTab === 'management' ? 
                    "Search org data..." :
                    selectedTab === 'checklist' ?
                    "Search checklist..." :
                    "Search tasks..."
                  }
                  className="pl-10 pr-4 py-2 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card-background text-foreground w-48 lg:w-80"
                />
              </div>
              <button
                onClick={() => setShowRightSidebar(true)}
                className="relative p-2 text-sidebar-foreground hover:text-foreground transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-sidebar-foreground hover:text-foreground transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-8">
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

          {/* Add Checklist tab content */}
          {selectedTab === 'checklist' && currentUser.permissions.canViewFMS && (
            <ChecklistTasks 
              fmsData={dataManager.getDataWithFallback('fms', currentUser.name)}
              currentUser={currentUser} 
              loading={false}
              error={null}
            />
          )}
          
          {selectedTab === 'hs' && currentUser.permissions.canViewHS && (
            <HSHelpSlip currentUser={currentUser} />
          )}

          {selectedTab === 'analytics' && currentUser.permissions.canViewAnalytics && (
            <div className="bg-card-background rounded-xl p-8 border border-border-color">
              <h2 className="text-2xl font-bold text-foreground mb-6">Analytics</h2>
              <p className="text-sidebar-foreground">Analytics component will be implemented here.</p>
            </div>
          )}

          {/* Management Dashboard - New Addition */}
          {selectedTab === 'management' && isManagementUser() && (
            <ManagementDashboard currentUser={currentUser} />
          )}

          {selectedTab === 'admin' && currentUser.permissions.canViewAdmin && (
            <AdminNotifications currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* New Task Notification Modal */}
      {showNewTaskModal && (
        <NewTaskNotification 
          notifications={newTaskNotifications}
          onClose={handleCloseNewTaskModal}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {/* Right Sidebar - User Profile */}
      {showRightSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-80 h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              <button 
                onClick={() => setShowRightSidebar(false)} 
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-4xl">
                  {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">{currentUser.name}</h3>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>

            {/* Info Cards */}
            <div className="bg-gray-50 p-6 space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm">
                <Briefcase className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-semibold text-gray-900">{currentUser.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Logged In At</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(parseInt(loginTime, 10)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300"
              >
                <LogOut className="w-5 h-5 inline mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
