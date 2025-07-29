import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Activity,
  Zap,
  Star,
  Timer,
  Bookmark,
  RefreshCw,
  MapPin,
  Wifi,
  Battery,
  Sun,
  Cloud,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Eye,
  BookOpen,
  PieChart,
  BarChart
} from 'lucide-react';
import dataManager from '../utils/DataManager';
import Weather from './Weather';

// Import components for background loading
import DelegationTasks from './DelegationTasks';
import FMSTasks from './FMSTasks';
import HTTasks from './HTTasks';
import PCTasks from './PCTasks';
import HSHelpSlip from './HSHelpSlip';

const Overview = ({ currentUser, onTabChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({ api: 'online', sheets: 'online', cache: 'online' });
  const [recentActivities, setRecentActivities] = useState([]);

  // Get cached data directly without useCachedData to avoid infinite loops
  const [delegationData, setDelegationData] = useState([]);
  const [fmsData, setFmsData] = useState([]);
  const [htData, setHtData] = useState([]);
  const [pcData, setPcData] = useState([]);
  const [hsData, setHsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Background loading state
  const [backgroundLoading, setBackgroundLoading] = useState({
    delegation: false,
    fms: false,
    ht: false,
    pc: false,
    hs: false
  });
  const [loadingProgress, setLoadingProgress] = useState([]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add loading progress message
  const addLoadingMessage = useCallback((module, message) => {
    setLoadingProgress(prev => [...prev, { module, message, timestamp: Date.now() }]);
  }, []);

  // Background component mounting for data loading
  const [mountComponents, setMountComponents] = useState({
    delegation: false,
    fms: false,
    ht: false,
    pc: false,
    hs: false
  });

  // Start background loading based on user permissions
  useEffect(() => {
    if (!currentUser?.name) return;

    const startBackgroundLoading = async () => {
      addLoadingMessage('system', 'Starting background data loading...');
      
      // Get list of permitted modules
      const permittedModules = [];
      if (currentUser.permissions.canViewDelegation) permittedModules.push('delegation');
      if (currentUser.permissions.canViewFMS) permittedModules.push('fms');
      if (currentUser.permissions.canViewHT) permittedModules.push('ht');
      if (currentUser.permissions.canViewPC) permittedModules.push('pc');
      if (currentUser.permissions.canViewHS) permittedModules.push('hs');

      // Load modules one by one to avoid overwhelming the system
      for (const module of permittedModules) {
        addLoadingMessage(module, `Loading ${module.toUpperCase()} data...`);
        
        setBackgroundLoading(prev => ({ ...prev, [module]: true }));
        
        // Mount the component to trigger data loading
        setMountComponents(prev => ({ ...prev, [module]: true }));
        
        // Wait a bit for component to load data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if data was loaded
        const hasData = dataManager.hasData(module, currentUser.name);
        if (hasData) {
          addLoadingMessage(module, `✓ ${module.toUpperCase()} data loaded successfully`);
        } else {
          addLoadingMessage(module, `⚠ ${module.toUpperCase()} data loading in progress...`);
        }
        
        setBackgroundLoading(prev => ({ ...prev, [module]: false }));
        
        // Unmount component after data is loaded to save memory
        setTimeout(() => {
          setMountComponents(prev => ({ ...prev, [module]: false }));
        }, 3000);
      }
      
      addLoadingMessage('system', '✓ Background loading completed!');
      
      // Final data load and stop main loading
      setTimeout(() => {
        loadCachedData();
        setLoading(false);
      }, 1000);
    };

    startBackgroundLoading();
  }, [currentUser?.name, currentUser?.permissions, addLoadingMessage]);

  // Load cached data on mount and periodically
  const loadCachedData = useCallback(() => {
    if (!currentUser?.name) return;

    const userId = currentUser.name;
    
    // Get data from cache directly
    const delegation = dataManager.getDataWithFallback('delegation', userId);
    const fms = dataManager.getDataWithFallback('fms', userId);
    const ht = dataManager.getDataWithFallback('ht', userId);
    const pc = dataManager.getDataWithFallback('pc', userId);
    const hs = dataManager.getDataWithFallback('hs', userId);

    setDelegationData(delegation);
    setFmsData(fms);
    setHtData(ht);
    setPcData(pc);
    setHsData(hs);

    console.log('Overview data refreshed:', {
      delegation: delegation.length,
      fms: fms.length,
      ht: ht.length,
      pc: pc.length,
      hs: hs.length
    });
  }, [currentUser?.name]);

  // ✅ REPLACE with cache update listener:
useEffect(() => {
  if (!loading) {
    // Listen for cache updates more frequently (every 30 seconds)
    const interval = setInterval(loadCachedData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }
}, [loading, loadCachedData]);

  // Calculate dynamic stats based on real data
  const stats = useMemo(() => {
    if (loading) return [];
    
    const baseStats = [];
    
    if (currentUser.permissions.canViewHT) {
      const htRaisedOnYou = htData.filter(task => task.issueDelegatedTo === currentUser.name);
      const htReplyPending = htRaisedOnYou.filter(task => 
        (!task.replyActual || task.replyActual.trim() === '')
      );
      
      baseStats.push({
        title: 'HT Reply Pending', 
        value: htReplyPending.length.toString(), 
        change: htReplyPending.length > 0 ? `${htReplyPending.length} awaiting` : 'All clear', 
        trend: htReplyPending.length > 3 ? 'up' : 'stable', 
        icon: Mail, 
        color: 'text-red-600 bg-red-50',
        description: 'Help tickets awaiting your response',
        onClick: () => onTabChange('ht-tasks'),
        total: htData.length
      });
    }
    
    if (currentUser.permissions.canViewDelegation) {
      const pendingTasks = delegationData.filter(task => 
        (task.delegation_status || 'pending').toLowerCase().includes('pending')
      );
      
      baseStats.push({
        title: 'Delegation Tasks', 
        value: pendingTasks.length.toString(), 
        change: delegationData.length > 0 ? `${delegationData.length} total` : 'No tasks', 
        trend: pendingTasks.length > 0 ? 'up' : 'stable', 
        icon: Users, 
        color: 'text-blue-600 bg-blue-50',
        description: 'Tasks assigned to you',
        onClick: () => onTabChange('delegation'),
        total: delegationData.length
      });
    }
    
    if (currentUser.permissions.canViewFMS) {
      
      const userFMSData = fmsData.filter(task => {
  const taskDoer = task.doer || task.assignedTo || '';
  return taskDoer === currentUser.name;
});
const totalFMSTasks = userFMSData.length;

      const delayedTasks = fmsData.filter(task => task.delay && task.delay.trim() !== '').length;
      
      baseStats.push({
        title: 'FMS Tasks', 
        value: totalFMSTasks.toString(), 
        change: delayedTasks > 0 ? `${delayedTasks} delayed` : 'On track', 
        trend: delayedTasks > 0 ? 'down' : 'up', 
        icon: FileText, 
        color: 'text-green-600 bg-green-50',
        description: 'Financial Management System tasks',
        onClick: () => onTabChange('fms'),
        total: totalFMSTasks
      });
    }
    
    if (currentUser.permissions.canViewPC) {
      const overdueTasks = pcData.filter(task => {
        const delay = task.delay || '';
        return delay && delay.trim() !== '';
      }).length;
      
      baseStats.push({
        title: 'PC Dashboard', 
        value: pcData.length.toString(), 
        change: overdueTasks > 0 ? `${overdueTasks} overdue` : 'On schedule', 
        trend: overdueTasks > 0 ? 'down' : 'up', 
        icon: Clipboard, 
        color: 'text-purple-600 bg-purple-50',
        description: 'Process Coordinator tasks',
        onClick: () => onTabChange('pc'),
        total: pcData.length
      });
    }
    
    if (currentUser.permissions.canViewHS) {
  // Check if user is director
  const isDirector = 
    (currentUser?.role?.toLowerCase() === 'director') || 
    (currentUser?.department?.toLowerCase() === 'director');
  
  let replyPendingHS, totalHS;
  
  if (isDirector) {
    // Directors: show all help slips awaiting director's reply
    const directorTasks = hsData.filter(task => 
      task.helpSlipId && task.helpSlipId.trim() !== ''
    );
    replyPendingHS = directorTasks.filter(task => 
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;
    totalHS = directorTasks.length;
  } else {
    // Regular users: show only their own tasks
    const userHSData = hsData.filter(task => 
      task.name === currentUser.name || task.assignedTo === currentUser.name
    );
    replyPendingHS = userHSData.filter(task => 
      task.replyPlanned && task.replyPlanned.trim() !== '' &&
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;
    totalHS = userHSData.length;
  }
  
  baseStats.push({
    title: 'Help Slips', 
    value: replyPendingHS.toString(), 
    change: totalHS > 0 ? `${totalHS} total` : 'No slips', 
    trend: replyPendingHS > 0 ? 'up' : 'stable', 
    icon: UserPlus, 
    color: 'text-orange-600 bg-orange-50',
    description: isDirector 
      ? 'Help slips awaiting your reply as director'
      : 'Help slips requiring attention',
    onClick: () => onTabChange('hs'),
    total: totalHS
  });
}
    
    // Performance calculation
    const allTasks = [...delegationData, ...fmsData, ...htData, ...pcData, ...hsData];
    const completedTasks = allTasks.filter(task => {
      const status = task.delegation_status || task.status || '';
      return status.toLowerCase().includes('completed') || status.toLowerCase().includes('done');
    }).length;
    
    const performanceRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
    
    baseStats.push({
      title: 'Performance', 
      value: `${performanceRate}%`, 
      change: performanceRate > 80 ? 'Excellent' : performanceRate > 60 ? 'Good' : 'Needs attention', 
      trend: performanceRate > 70 ? 'up' : 'down', 
      icon: TrendingUp, 
      color: 'text-indigo-600 bg-indigo-50',
      description: 'Task completion rate',
      onClick: () => onTabChange('analytics'),
      total: allTasks.length
    });
    
    return baseStats;
  }, [delegationData, fmsData, htData, pcData, hsData, currentUser.permissions, onTabChange, currentUser.name, loading]);

  // Get priority tasks from all modules - FILTERED BY CURRENT USER
  const priorityTasks = useMemo(() => {
    const tasks = [];
    
    // Add HT urgent tasks - only those assigned to current user
    if (currentUser.permissions.canViewHT) {
      const urgentHT = htData
        .filter(task => {
          // Filter by user: either assigned to them OR raised by them
          const isAssignedToUser = task.issueDelegatedTo === currentUser.name;
          const isRaisedByUser = task.name === currentUser.name;
          const isHighPriority = task.challengeLevel?.toUpperCase() === 'HIGH';
          const isPending = (!task.replyActual || task.replyActual.trim() === '');

          return (isAssignedToUser || isRaisedByUser) && isHighPriority && isPending;
        })
        .slice(0, 2)
        .map(task => ({
          id: task.ticketId || task.id,
          title: task.challengeIssue || 'HT Task',
          type: 'HT',
          priority: 'urgent',
          dueDate: task.replyPlanned || task.timestamp,
          module: 'ht-tasks',
          assignedTo: task.issueDelegatedTo,
          raisedBy: task.name
        }));
      tasks.push(...urgentHT);
    }
    
    // Add high priority delegation tasks - only those assigned to current user
    if (currentUser.permissions.canViewDelegation) {
      const urgentDelegation = delegationData
        .filter(task => {
          // Filter by doer name (person task is assigned to)
          const isAssignedToUser = (task.doer_name || task.doer) === currentUser.name;
          const score = parseFloat(task['80_20'] || task.priority_score || 0);
          const isHighPriority = score >= 75;
          const isPending = (task.delegation_status || 'pending').toLowerCase().includes('pending');

          
          return isAssignedToUser && isHighPriority && isPending;
        })
        .slice(0, 2)
        .map(task => ({
          id: task.id,
          title: task.task || 'Delegation Task',
          type: 'Delegation',
          priority: 'high',
          dueDate: task.final_date || task.first_date,
          module: 'delegation',
          assignedTo: task.doer_name || task.doer
        }));
      tasks.push(...urgentDelegation);
    }
    
    // Add overdue FMS tasks - only those assigned to current user
    if (currentUser.permissions.canViewFMS) {
      const overdueFMS = fmsData
        .filter(task => {
          // Filter by doer (person task is assigned to)
          const isAssignedToUser = task.doer === currentUser.name;
          const isOverdue = task.delay && task.delay.trim() !== '';
          
          return isAssignedToUser && isOverdue;
        })
        .slice(0, 2)
        .map(task => ({
          id: task.id,
          title: task.what_to_do || 'FMS Task',
          type: 'FMS',
          priority: 'overdue',
          dueDate: task.planned || 'Not set',
          module: 'fms',
          assignedTo: task.doer
        }));
      tasks.push(...overdueFMS);
    }

    // Add overdue PC tasks - only those where current user is PC
    if (currentUser.permissions.canViewPC) {
      const overduePC = pcData
        .filter(task => {
          // Filter by PC field (Process Coordinator)
          const isPCUser = (task.pc || task.pcdeo) === currentUser.name;
          const isOverdue = task.delay && task.delay.trim() !== '';
          
          return isPCUser && isOverdue;
        })
        .slice(0, 2)
        .map(task => ({
          id: task.id,
          title: task.what_to_do || 'PC Task',
          type: 'PC',
          priority: 'overdue',
          dueDate: task.planned || 'Not set',
          module: 'pc',
          assignedTo: task.doer,
          pc: task.pc || task.pcdeo
        }));
      tasks.push(...overduePC);
    }

    // Add HS tasks - only those where current user is involved
    if (currentUser.permissions.canViewHS) {
      const urgentHS = hsData
        .filter(task => {
          // Filter by user involvement: either raised by them or assigned to them
          const isRaisedByUser = task.name === currentUser.name;
          const isAssignedToUser = task.assignedTo === currentUser.name;
          const isReplyPending = task.replyPlanned && task.replyPlanned.trim() !== '' && 
                                (!task.replyActual || task.replyActual.trim() === '');
          
          return (isRaisedByUser || isAssignedToUser) && isReplyPending;
        })
        .slice(0, 2)
        .map(task => ({
          id: task.helpSlipId || task.id,
          title: task.challengeIssue || 'Help Slip',
          type: 'HS',
          priority: 'pending',
          dueDate: task.replyPlanned || 'Not set',
          module: 'hs',
          raisedBy: task.name
        }));
      tasks.push(...urgentHS);
    }
    
    return tasks.slice(0, 6); // Limit to 6 tasks
  }, [delegationData, fmsData, htData, pcData, hsData, currentUser.permissions, currentUser.name]);

  // Generate recent activities from real cached data - FILTERED BY CURRENT USER
  const activities = useMemo(() => {
    const allActivities = [];
    
    // Helper function to format time
    // ✅ FIXED VERSION:
const formatActivityTime = (dateStr) => {
  if (!dateStr || dateStr === 'Recently') return 'Recently';
  
  try {
    const date = new Date(dateStr);
    // ✅ ADD: Check if date is valid before calculating
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    // ✅ ADD: Check for negative values (invalid dates)
    if (diffInHours < 0) return 'Recently';
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 0 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  } catch (error) {
    return 'Recently';
  }
};

    // Helper function to get timestamp for sorting
    const getTimestampForSorting = (dateStr) => {
      if (!dateStr || dateStr === 'Recently') return 0;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      } catch (error) {
        return 0;
      }
    };

    // Recent delegation tasks - only those assigned to current user
    // Sort by Task Created Date
    if (currentUser.permissions.canViewDelegation && delegationData.length > 0) {
      const userDelegationTasks = delegationData.filter(task => 
        (task.doer_name || task.doer) === currentUser.name
      );
      
      // Sort by task_created_date and take most recent
      const recentDelegation = [...userDelegationTasks]
        .sort((a, b) => {
          const dateA = getTimestampForSorting(a.task_created_date || a.first_date);
          const dateB = getTimestampForSorting(b.task_created_date || b.first_date);
          return dateB - dateA; // Latest first
        })
        .slice(0, 3);

      recentDelegation.forEach(task => {
        const taskTitle = task.task || 'Delegation task';
        const truncatedTitle = taskTitle.length > 50 ? taskTitle.substring(0, 50) + '...' : taskTitle;
        
        // Use task_created_date, fallback to first_date, then to 'Recently'
        let activityDate = task.task_created_date || task.first_date;
        
        // Handle various date formats for delegation tasks
        if (activityDate) {
          // Check if it's already a valid date string
          const testDate = new Date(activityDate);
          if (isNaN(testDate.getTime())) {
            // Try common date formats
            const formats = [
              // Try MM/DD/YYYY format
              activityDate.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2'),
              // Try DD/MM/YYYY format  
              activityDate.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'),
              // Try MM-DD-YYYY format
              activityDate.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$1-$2'),
              // Try DD-MM-YYYY format
              activityDate.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$2-$1')
            ];
            
            // Find first valid format
            for (const format of formats) {
              const formatTest = new Date(format);
              if (!isNaN(formatTest.getTime())) {
                activityDate = format;
                break;
              }
            }
            
            // If still invalid, use 'Recently'
            const finalTest = new Date(activityDate);
            if (isNaN(finalTest.getTime())) {
              activityDate = 'Recently';
            }
          }
        } else {
          activityDate = 'Recently';
        }
        
        allActivities.push({
          id: `del-${task.id || task.rowNumber}`,
          action: 'Delegation task assigned to you',
          details: truncatedTitle,
          time: formatActivityTime(activityDate),
          timestamp: getTimestampForSorting(activityDate),
          icon: Users,
          color: 'text-blue-600',
          module: 'delegation'
        });
      });
    }
    
    // Recent FMS activities - only those assigned to current user
    // Sort by Planned date
    if (currentUser.permissions.canViewFMS && fmsData.length > 0) {
      const userFMSTasks = fmsData.filter(task => task.doer === currentUser.name);
      
      const recentFMS = [...userFMSTasks]
        .sort((a, b) => {
          const dateA = getTimestampForSorting(a.planned);
          const dateB = getTimestampForSorting(b.planned);
          return dateB - dateA; // Latest first
        })
        .slice(0, 3);

      recentFMS.forEach(task => {
        const fmsType = task.fms || 'FMS task';
        const whatToDo = task.what_to_do || '';
        const details = whatToDo ? (whatToDo.length > 50 ? whatToDo.substring(0, 50) + '...' : whatToDo) : fmsType;
        const plannedDate = task.planned;
        
        allActivities.push({
          id: `fms-${task.id || task.rowNumber}`,
          action: task.delay && task.delay.trim() ? 'Your FMS task is delayed' : 'FMS task assigned to you',
          details: details,
          time: formatActivityTime(plannedDate),
          timestamp: getTimestampForSorting(plannedDate),
          icon: FileText,
          color: task.delay && task.delay.trim() ? 'text-orange-600' : 'text-green-600',
          module: 'fms'
        });
      });
    }
    
    // Recent HT activities - only those involving current user
    // Sort by Timestamp
    if (currentUser.permissions.canViewHT && htData.length > 0) {
      const userHTTasks = htData.filter(task => 
        task.issueDelegatedTo === currentUser.name || task.name === currentUser.name
      );
      
      const recentHT = [...userHTTasks]
        .sort((a, b) => {
          const dateA = getTimestampForSorting(a.timestamp);
          const dateB = getTimestampForSorting(b.timestamp);
          return dateB - dateA; // Latest first
        })
        .slice(0, 3);

      recentHT.forEach(task => {
        const issue = task.challengeIssue || 'Help ticket';
        const truncatedIssue = issue.length > 50 ? issue.substring(0, 50) + '...' : issue;
        const timestamp = task.timestamp;
        
        // Determine action based on user role and task status
        let action = 'Help ticket received';
        if (task.issueDelegatedTo === currentUser.name) {
          if (task.replyActual && task.replyActual.trim() !== '') {
            action = 'You replied to help ticket';
          } else if (task.replyPlanned && task.replyPlanned.trim() !== '') {
            action = 'Help ticket assigned to you';
          } else {
            action = 'Help ticket assigned to you';
          }
        } else if (task.name === currentUser.name) {
          if (task.replyActual && task.replyActual.trim() !== '') {
            action = 'Your help ticket was replied';
          } else {
            action = 'You raised a help ticket';
          }
        }
        
        allActivities.push({
          id: `ht-${task.ticketId || task.id}`,
          action: action,
          details: truncatedIssue,
          time: formatActivityTime(timestamp),
          timestamp: getTimestampForSorting(timestamp),
          icon: Mail,
          color: task.challengeLevel?.toUpperCase() === 'HIGH' ? 'text-red-600' : 'text-blue-600',
          module: 'ht-tasks'
        });
      });
    }

    // Recent PC activities - only those where current user is PC
    // Sort by Planned date
    if (currentUser.permissions.canViewPC && pcData.length > 0) {
      const userPCTasks = pcData.filter(task => 
        (task.pc || task.pcdeo) === currentUser.name
      );
      
      const recentPC = [...userPCTasks]
        .sort((a, b) => {
          const dateA = getTimestampForSorting(a.planned);
          const dateB = getTimestampForSorting(b.planned);
          return dateB - dateA; // Latest first
        })
        .slice(0, 3);

      recentPC.forEach(task => {
        const whatToDo = task.what_to_do || 'PC task';
        const truncatedTask = whatToDo.length > 50 ? whatToDo.substring(0, 50) + '...' : whatToDo;
        const plannedDate = task.planned;
        
        allActivities.push({
          id: `pc-${task.id || task.rowNumber}`,
          action: task.delay && task.delay.trim() ? 'PC task under your supervision is overdue' : 'PC task under your supervision',
          details: truncatedTask,
          time: formatActivityTime(plannedDate),
          timestamp: getTimestampForSorting(plannedDate),
          icon: Clipboard,
          color: task.delay && task.delay.trim() ? 'text-red-600' : 'text-purple-600',
          module: 'pc'
        });
      });
    }

    // Recent HS activities - only those involving current user
    // Sort by Timestamp
    if (currentUser.permissions.canViewHS && hsData.length > 0) {
      const userHSTasks = hsData.filter(task => 
        task.name === currentUser.name || task.assignedTo === currentUser.name
      );
      
      const recentHS = [...userHSTasks]
        .sort((a, b) => {
          const dateA = getTimestampForSorting(a.timestamp);
          const dateB = getTimestampForSorting(b.timestamp);
          return dateB - dateA; // Latest first
        })
        .slice(0, 3);

      recentHS.forEach(task => {
        const issue = task.challengeIssue || 'Help slip';
        const truncatedIssue = issue.length > 50 ? issue.substring(0, 50) + '...' : issue;
        const timestamp = task.timestamp;
        
        let action = 'Help slip created';
        if (task.name === currentUser.name) {
          if (task.replyActual && task.replyActual.trim() !== '') {
            action = 'Your help slip was replied';
          } else {
            action = 'You created a help slip';
          }
        } else if (task.assignedTo === currentUser.name) {
          if (task.replyActual && task.replyActual.trim() !== '') {
            action = 'You replied to help slip';
          } else {
            action = 'Help slip assigned to you';
          }
        }
        
        allActivities.push({
          id: `hs-${task.helpSlipId || task.id}`,
          action: action,
          details: truncatedIssue,
          time: formatActivityTime(timestamp),
          timestamp: getTimestampForSorting(timestamp),
          icon: UserPlus,
          color: 'text-orange-600',
          module: 'hs'
        });
      });
    }
    
    // Sort ALL activities by timestamp (latest first) and limit to 8
    return allActivities
      .sort((a, b) => {
        // Sort by actual timestamp for proper chronological order
        return b.timestamp - a.timestamp; // Latest first
      })
      .slice(0, 8);
  }, [delegationData, fmsData, htData, pcData, hsData, currentUser.permissions, currentUser.name]);

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


  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
  };

  // Show loading state if still loading
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Enhanced Header Section - Show even when loading */}
        <div className={`bg-gradient-to-r ${getRoleColor(currentUser.role)} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-lg opacity-90 mb-1">{formatDate(currentTime)}</p>
              <div className="flex items-center space-x-6 text-sm opacity-80">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(currentTime)}</span>
                </div>
                <Weather />
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Loading Data...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </div>
              </div>
              <p className="text-sm opacity-75">{currentUser.role} • {currentUser.department}</p>
              <p className="text-xs opacity-60">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Loading Message with Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Initializing modules and loading data in background...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          {/* Loading Progress */}
          <div className="max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Loading Progress</h4>
            
            {/* Module Loading Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentUser.permissions.canViewDelegation && (
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  backgroundLoading.delegation ? 'border-blue-500 bg-blue-50' : 
                  dataManager.hasData('delegation', currentUser.name) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Users className={`w-5 h-5 ${
                      backgroundLoading.delegation ? 'text-blue-600 animate-pulse' :
                      dataManager.hasData('delegation', currentUser.name) ? 'text-green-600' :
                      'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">Delegation Tasks</p>
                      <p className="text-sm text-gray-600">
                        {backgroundLoading.delegation ? 'Loading...' :
                         dataManager.hasData('delegation', currentUser.name) ? 'Ready' :
                         'Waiting'}
                      </p>
                    </div>
                    {dataManager.hasData('delegation', currentUser.name) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewFMS && (
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  backgroundLoading.fms ? 'border-blue-500 bg-blue-50' : 
                  dataManager.hasData('fms', currentUser.name) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FileText className={`w-5 h-5 ${
                      backgroundLoading.fms ? 'text-blue-600 animate-pulse' :
                      dataManager.hasData('fms', currentUser.name) ? 'text-green-600' :
                      'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">FMS Tasks</p>
                      <p className="text-sm text-gray-600">
                        {backgroundLoading.fms ? 'Loading...' :
                         dataManager.hasData('fms', currentUser.name) ? 'Ready' :
                         'Waiting'}
                      </p>
                    </div>
                    {dataManager.hasData('fms', currentUser.name) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewHT && (
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  backgroundLoading.ht ? 'border-blue-500 bg-blue-50' : 
                  dataManager.hasData('ht', currentUser.name) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Mail className={`w-5 h-5 ${
                      backgroundLoading.ht ? 'text-blue-600 animate-pulse' :
                      dataManager.hasData('ht', currentUser.name) ? 'text-green-600' :
                      'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">Help Tickets</p>
                      <p className="text-sm text-gray-600">
                        {backgroundLoading.ht ? 'Loading...' :
                         dataManager.hasData('ht', currentUser.name) ? 'Ready' :
                         'Waiting'}
                      </p>
                    </div>
                    {dataManager.hasData('ht', currentUser.name) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewPC && (
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  backgroundLoading.pc ? 'border-blue-500 bg-blue-50' : 
                  dataManager.hasData('pc', currentUser.name) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Clipboard className={`w-5 h-5 ${
                      backgroundLoading.pc ? 'text-blue-600 animate-pulse' :
                      dataManager.hasData('pc', currentUser.name) ? 'text-green-600' :
                      'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">PC Dashboard</p>
                      <p className="text-sm text-gray-600">
                        {backgroundLoading.pc ? 'Loading...' :
                         dataManager.hasData('pc', currentUser.name) ? 'Ready' :
                         'Waiting'}
                      </p>
                    </div>
                    {dataManager.hasData('pc', currentUser.name) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewHS && (
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  backgroundLoading.hs ? 'border-blue-500 bg-blue-50' : 
                  dataManager.hasData('hs', currentUser.name) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <UserPlus className={`w-5 h-5 ${
                      backgroundLoading.hs ? 'text-blue-600 animate-pulse' :
                      dataManager.hasData('hs', currentUser.name) ? 'text-green-600' :
                      'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">Help Slips</p>
                      <p className="text-sm text-gray-600">
                        {backgroundLoading.hs ? 'Loading...' :
                         dataManager.hasData('hs', currentUser.name) ? 'Ready' :
                         'Waiting'}
                      </p>
                    </div>
                    {dataManager.hasData('hs', currentUser.name) && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Loading Messages Log */}
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h5 className="font-medium text-gray-900 mb-2">Loading Log:</h5>
              <div className="space-y-1 text-sm">
                {loadingProgress.map((log, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`${
                      log.message.includes('✓') ? 'text-green-600' :
                      log.message.includes('⚠') ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {loadingProgress.length === 0 && (
                  <p className="text-gray-500 italic">Initializing...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Background Component Mounting (Hidden) */}
        <div className="hidden">
          {mountComponents.delegation && currentUser.permissions.canViewDelegation && (
            <DelegationTasks currentUser={currentUser} />
          )}
          {mountComponents.fms && currentUser.permissions.canViewFMS && (
            <FMSTasks currentUser={currentUser} />
          )}
          {mountComponents.ht && currentUser.permissions.canViewHT && (
            <HTTasks currentUser={currentUser} />
          )}
          {mountComponents.pc && currentUser.permissions.canViewPC && (
            <PCTasks currentUser={currentUser} />
          )}
          {mountComponents.hs && currentUser.permissions.canViewHS && (
            <HSHelpSlip currentUser={currentUser} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className={`bg-gradient-to-r ${getRoleColor(currentUser.role)} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-lg opacity-90 mb-1">{formatDate(currentTime)}</p>
            <div className="flex items-center space-x-6 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(currentTime)}</span>
              </div>
              <Weather />
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <Battery className="w-4 h-4" />
                <span className="text-sm">Cache Active</span>
              </div>
            </div>
            <p className="text-sm opacity-75">{currentUser.role} • {currentUser.department}</p>
            <p className="text-xs opacity-60">{currentUser.email}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            onClick={stat.onClick}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                {getTrendIcon(stat.trend)}
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 
                stat.trend === 'down' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {stat.change}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
            
            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full ${stat.color.includes('red') ? 'bg-red-500' : 
                  stat.color.includes('blue') ? 'bg-blue-500' :
                  stat.color.includes('green') ? 'bg-green-500' :
                  stat.color.includes('purple') ? 'bg-purple-500' :
                  stat.color.includes('orange') ? 'bg-orange-500' : 'bg-indigo-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (parseInt(stat.value) / Math.max(stat.total || 10, 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Priority Tasks Today */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-3 text-orange-500" />
              Priority Tasks Today
            </h3>
            <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full font-medium">
              {priorityTasks.length} items
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {priorityTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h4>
              <p className="text-gray-600">No urgent tasks requiring immediate attention.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priorityTasks.map((task, index) => (
                <div 
                  key={task.id}
                  onClick={() => onTabChange(task.module)}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                    task.priority === 'urgent' ? 'border-l-red-500 bg-red-50' :
                    task.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{task.type}</span>
                    <Timer className="w-4 h-4 text-gray-400" />
                  </div>
                  <h5 className="font-semibold text-gray-900 mb-2 line-clamp-2">{task.title}</h5>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Due: {task.dueDate}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed and Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-blue-500" />
                Recent Activity
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activity</h4>
                <p className="text-gray-600">
                  {Object.values(currentUser.permissions).some(p => p) 
                    ? 'Activity will appear here as you work with tasks'
                    : 'No modules available for your role'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    onClick={() => onTabChange(activity.module)}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className={`p-2 rounded-full bg-gray-100 ${activity.color} group-hover:scale-110 transition-transform`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{activity.details}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-purple-500" />
              Performance Insights
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                  <span className="text-sm font-bold text-purple-600">
                    {stats.find(s => s.title === 'Performance')?.value || '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: stats.find(s => s.title === 'Performance')?.value || '0%' }}
                  ></div>
                </div>
              </div>

              {/* Module Performance */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Module Overview</h4>
                {stats.slice(0, 4).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <stat.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{stat.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                      {getTrendIcon(stat.trend)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Achievement */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Weekly Goal</h4>
                    <p className="text-sm text-gray-600">
                      {parseInt(stats.find(s => s.title === 'Performance')?.value || '0') > 80 
                        ? 'Excellent performance this week!' 
                        : 'Keep up the good work!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tools Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Zap className="w-6 h-6 mr-3 text-yellow-500" />
            Quick Tools & Shortcuts
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Global Search</span>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bookmark className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Bookmarks</span>
            </button>
            
            <button 
              onClick={() => onTabChange('notifications')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Notifications</span>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className={`bg-gradient-to-br ${getRoleColor(currentUser.role)} rounded-xl p-6 text-white`}>
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <Plus className="w-6 h-6 mr-3" />
          Quick Actions for {currentUser.role}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentUser.permissions.canViewHT && (
            <button 
              onClick={() => onTabChange('ht-tasks')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              <span>View HT Tasks</span>
            </button>
          )}
          {currentUser.permissions.canViewDelegation && (
            <button 
              onClick={() => onTabChange('delegation')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <Users className="w-5 h-5" />
              <span>View Delegation</span>
            </button>
          )}
          {currentUser.permissions.canViewFMS && (
            <button 
              onClick={() => onTabChange('fms')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              <span>View FMS Tasks</span>
            </button>
          )}
          {currentUser.permissions.canViewPC && (
            <button 
              onClick={() => onTabChange('pc')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <Clipboard className="w-5 h-5" />
              <span>PC Dashboard</span>
            </button>
          )}
          {currentUser.permissions.canViewHS && (
            <button 
              onClick={() => onTabChange('hs')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              <span>Help Slips</span>
            </button>
          )}
          {currentUser.permissions.canViewAnalytics && (
            <button 
              onClick={() => onTabChange('analytics')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>
          )}
          {currentUser.permissions.canViewAdmin && (
            <button 
              onClick={() => onTabChange('admin')}
              className="flex items-center space-x-3 p-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105"
            >
              <Settings className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
