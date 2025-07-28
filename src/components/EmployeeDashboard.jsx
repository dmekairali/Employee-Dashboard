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
import dataManager from '../utils/DataManager';

const EmployeeDashboard = ({ currentUser, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('notifications'); // Changed default to notifications
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
          console.log('New tasks detected:', notification); // Add this line

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
          console.log('Setting modal to show'); // Add this line
        
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      setSelectedTab('notifications'); // Changed default fallback to notifications
    }
  }, [currentUser, navigationItems, selectedTab]);

  // Data structure matching your AppSheet setup
  const htReplyPending = [
    { 
      id: 'HT-165082', 
      employee: 'Dhaneshwar Chaturvedi', 
      message: 'Dear Ambuj, New Employee: HARISH MISHRA is joining...', 
      type: 'onboarding',
      priority: 'high',
      date: '2025-07-25'
    },
    { 
      id: 'HT-165069', 
      employee: 'Ritu Chawla', 
      message: 'This helpticket is auto generated from escalated ticket id...', 
      type: 'escalation',
      priority: 'urgent',
      date: '2025-07-25'
    },
    { 
      id: 'HT-165042', 
      employee: 'Sakthivel S', 
      message: 'Please check following data of IMS Ayurvedic IN/OUT Sh...', 
      type: 'data-check',
      priority: 'medium',
      date: '2025-07-24'
    },
    { 
      id: 'HT-164971', 
      employee: 'Sakthivel S', 
      message: 'Please check following data of IMS Ayurvedic IN/OUT Sh...', 
      type: 'data-check',
      priority: 'medium',
      date: '2025-07-24'
    },
    { 
      id: 'HT-164946', 
      employee: 'Dhaneshwar Chaturvedi', 
      message: 'Dear Ambuj, New Employee: HARISH MISHRA is joining...', 
      type: 'onboarding',
      priority: 'high',
      date: '2025-07-24'
    },
    { 
      id: 'HT-164700', 
      employee: 'Kavita', 
      message: 'Primary Order- Lost Clients Tracker FMS order form not c...', 
      type: 'form-issue',
      priority: 'high',
      date: '2025-07-23'
    }
  ];

  const delegationTasks = [
    { 
      id: 1, 
      title: 'content fms to have ai review step l...', 
      status: 'Pending', 
      date: '7/19/2025', 
      priority: 'high',
      assignee: 'AI Team'
    },
    { 
      id: 2, 
      title: 'kappl incentive review HQ team and...', 
      status: 'Pending', 
      date: '7/19/2025', 
      priority: 'medium',
      assignee: 'HQ Team'
    },
    { 
      id: 3, 
      title: 'roll out on priority - https://claude.ai...', 
      status: 'Pending', 
      date: '7/19/2025', 
      priority: 'high',
      assignee: 'Tech Team'
    },
    { 
      id: 4, 
      title: 'Automate financial summary into s...', 
      status: 'Pending', 
      date: '7/20/2025', 
      priority: 'medium',
      assignee: 'Finance Team'
    },
    { 
      id: 5, 
      title: 'all staff to have react dashboard wit...', 
      status: 'Pending', 
      date: '7/21/2025', 
      priority: 'high',
      assignee: 'Dev Team'
    },
    { 
      id: 6, 
      title: 'roll out incentive for kappl and ktah...', 
      status: 'Pending', 
      date: '7/22/2025', 
      priority: 'medium',
      assignee: 'HR Team'
    }
  ];

  const fmsTasks = [
    { id: 30, count: 11, type: 'Active Orders', priority: 'high' },
    { id: 29, count: 4, type: 'Processing', priority: 'medium' },
    { id: 28, count: 6, type: 'Pending Review', priority: 'low' }
  ];

  const getStatsForRole = (role, permissions) => {
    const baseStats = [];
    
    if (permissions.canViewHT) {
      baseStats.push({
        title: 'Reply Pending', 
        value: htReplyPending.length.toString(), 
        change: '+2 today', 
        trend: 'up', 
        icon: Mail, 
        color: 'text-red-600 bg-red-50',
        description: 'HT Tickets awaiting response'
      });
    }
    
    if (permissions.canViewDelegation) {
      baseStats.push({
        title: 'Delegated Tasks', 
        value: delegationTasks.length.toString(), 
        change: '+3 this week', 
        trend: 'up', 
        icon: Users, 
        color: 'text-blue-600 bg-blue-50',
        description: 'Tasks assigned to teams'
      });
    }
    
    if (permissions.canViewFMS) {
      baseStats.push({
        title: 'FMS Orders', 
        value: fmsTasks.reduce((sum, task) => sum + task.count, 0).toString(), 
        change: '+8 today', 
        trend: 'up', 
        icon: FileText, 
        color: 'text-green-600 bg-green-50',
        description: 'Active FMS transactions'
      });
    }
    
    if (permissions.canViewAnalytics) {
      baseStats.push({
        title: 'Performance', 
        value: '87%', 
        change: '+5%', 
        trend: 'up', 
        icon: TrendingUp, 
        color: 'text-purple-600 bg-purple-50',
        description: 'Task completion rate'
      });
    }
    
    return baseStats;
  };

  const stats = getStatsForRole(currentUser.role, currentUser.permissions);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'onboarding': return UserPlus;
      case 'escalation': return AlertTriangle;
      case 'data-check': return BarChart3;
      case 'form-issue': return FileText;
      default: return Ticket;
    }
  };

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
                {currentUser.role} Dashboard
              </h2>
              <p className="text-gray-600">
                Welcome back, {currentUser.name.split(' ')[0]} • {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
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
          {/* Conditional Content Based on Selected Tab */}
          {selectedTab === 'notifications' && (
            <NotificationsAnnouncements currentUser={currentUser} />
          )}

          {selectedTab === 'overview' && (
            <>
              {/* Role-based Access Notice - Overview Only */}
              <div className={`mb-6 p-4 bg-gradient-to-r ${getRoleColor(currentUser.role)} rounded-lg text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{currentUser.role} Access Level</h3>
                    <p className="text-sm opacity-90">You have access to {navigationItems.length} modules</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">{currentUser.department}</p>
                    <p className="text-xs opacity-75">{currentUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid - Overview Only */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(stats.length, 4)} gap-6 mb-8`}>
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* HT - Reply Pending */}
              {currentUser.permissions.canViewHT && (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-red-500" />
                        HT - Reply Pending
                      </h3>
                      <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        {htReplyPending.length} items
                      </span>
                    </div>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {htReplyPending.slice(0, 3).map((ticket) => {
                        const TypeIcon = getTypeIcon(ticket.type);
                        return (
                          <div key={ticket.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(ticket.priority)} hover:shadow-md transition-all cursor-pointer`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <TypeIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-mono text-gray-500">{ticket.id}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{ticket.employee}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{ticket.date}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* HT - Resolve Pending */}
              {currentUser.permissions.canViewHT && (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                      HT - Resolve Pending
                    </h3>
                  </div>
                  <div className="p-6 flex flex-col items-center justify-center h-64">
                    <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
                    <p className="text-gray-500 text-center">No items</p>
                    <p className="text-sm text-gray-400 text-center mt-2">All tickets have been resolved</p>
                  </div>
                </div>
              )}

              {/* Delegation Overview */}
              {currentUser.permissions.canViewDelegation && (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Delegation
                      </h3>
                      <button
                        onClick={() => setSelectedTab('delegation')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {delegationTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-all cursor-pointer`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium mb-2 line-clamp-2">{task.title}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{task.date}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {task.assignee}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FMS Overview */}
              {currentUser.permissions.canViewFMS && (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-purple-500" />
                        FMS
                      </h3>
                      <button
                        onClick={() => setSelectedTab('fms')}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {fmsTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 font-bold">{task.id}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{task.type}</p>
                              <p className="text-sm text-gray-500">{task.count} items</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">Total Active</h4>
                          <p className="text-2xl font-bold text-purple-600">
                            {fmsTasks.reduce((sum, task) => sum + task.count, 0)}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

          {/* Quick Actions */}
          <div className={`mt-8 bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-xl p-6 text-white`}>
            <h3 className="text-lg font-semibold mb-4">Quick Actions for {currentUser.role}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentUser.permissions.canViewHT && (
                <button className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>New HT Ticket</span>
                </button>
              )}
              {currentUser.permissions.canViewDelegation && (
                <button className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Users className="w-5 h-5" />
                  <span>New HelpSlip Ticket</span>
                </button>
              )}
              {currentUser.permissions.canViewFMS && (
                <button className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Place New Order</span>
                </button>
              )}
              {currentUser.permissions.canViewAnalytics && (
                <button className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Download className="w-5 h-5" />
                  <span>Export Report</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
