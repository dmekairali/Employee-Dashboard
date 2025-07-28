import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Megaphone, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  Pin,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Archive,
  Star,
  Filter,
  Search,
  RefreshCw,
  Loader
} from 'lucide-react';
import { useNotifications, useNotificationReadStatus } from '../hooks/useNotifications';

const NotificationsAnnouncements = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch notifications and announcements from Google Sheets
  const { data, loading, error, refresh, lastRefresh } = useNotifications(currentUser);
  const { notifications = [], announcements = [] } = data || {};

  // Manage read status locally
  const { getReadItems, markAsRead, markAsUnread } = useNotificationReadStatus(currentUser);
  const [readItems, setReadItems] = useState(getReadItems());

  // Update read items when user changes
  useEffect(() => {
    setReadItems(getReadItems());
  }, [currentUser]);

  const toggleRead = (id) => {
    if (readItems.has(id)) {
      const newReadItems = markAsUnread(id);
      setReadItems(newReadItems);
    } else {
      const newReadItems = markAsRead([id]);
      setReadItems(newReadItems);
    }
  };

  const markAllAsRead = () => {
    const allIds = getFilteredItems().map(item => item.id);
    const newReadItems = markAsRead(allIds);
    setReadItems(newReadItems);
  };

  // Filter items based on user role and current filters
  const getFilteredItems = () => {
    let allItems = [];
    
    if (selectedTab === 'all' || selectedTab === 'notifications') {
      allItems = [...allItems, ...notifications];
    }
    
    if (selectedTab === 'all' || selectedTab === 'announcements') {
      allItems = [...allItems, ...announcements];
    }

    // Filter by type
    if (filterType !== 'all') {
      allItems = allItems.filter(item => item.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      allItems = allItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort: pinned first, then by timestamp (newest first)
    allItems.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return allItems;
  };

  const filteredItems = getFilteredItems();
  const unreadCount = filteredItems.filter(item => !readItems.has(item.id)).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInHours / 24);
        if (days < 7) {
          return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
          return date.toLocaleDateString();
        }
      }
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
        
        {/* Fallback message for missing configuration */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Required:</h4>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Configure REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_NOTIFICATIONS</li>
            <li>• Create "Notifications" and "Announcements" sheets</li>
            <li>• Add column headers as specified in documentation</li>
            <li>• Share spreadsheet with service account</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-600" />
            Important Notifications & Announcements
          </h2>
          <p className="text-gray-600">
            Stay updated with important information and announcements
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                {unreadCount} unread
              </span>
            )}
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Mark All as Read
            </button>
          )}
          <button 
            onClick={refresh}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({notifications.length + announcements.length})
            </button>
            <button
              onClick={() => setSelectedTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setSelectedTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'announcements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Announcements ({announcements.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notifications and announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="urgent">Urgent</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No notifications or announcements match your search'
                : 'No notifications or announcements available'
              }
            </p>
            {!searchTerm && !loading && (notifications.length === 0 && announcements.length === 0) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  To see notifications and announcements here:
                </p>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• Add data to your Google Sheets</li>
                  <li>• Ensure targeting includes your role: {currentUser.role}</li>
                  <li>• Check that items are marked as "Active"</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            const isRead = readItems.has(item.id);
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
                  isRead ? 'opacity-75' : ''
                }`}
              >
                <div className={`border-l-4 ${getTypeColor(item.type)} p-6`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${item.type === 'urgent' ? 'bg-red-100' : item.type === 'warning' ? 'bg-yellow-100' : item.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          <TypeIcon className={`w-5 h-5 ${item.type === 'urgent' ? 'text-red-600' : item.type === 'warning' ? 'text-yellow-600' : item.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        
                        {item.isPinned && (
                          <Pin className="w-4 h-4 text-orange-500" />
                        )}
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(item.type)}`}>
                          {item.type.toUpperCase()}
                        </span>
                        
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.itemType === 'notification' ? (
                            <Bell className="w-3 h-3 inline mr-1" />
                          ) : (
                            <Megaphone className="w-3 h-3 inline mr-1" />
                          )}
                          {item.itemType}
                        </span>

                        {item.category && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>

                      {/* Message */}
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Attachments */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                          <div className="space-y-1">
                            {item.attachments.map((attachment, index) => (
                              <a 
                                key={index}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {item.actionRequired && item.actionText && item.actionLink && (
                        <div className="mb-4">
                          <a 
                            href={item.actionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              item.type === 'urgent' 
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {item.actionText}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {item.author}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(item.timestamp)}
                          </span>
                          {item.expiresAt && (
                            <span className="flex items-center text-orange-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              Expires: {new Date(item.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleRead(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isRead 
                            ? 'text-gray-400 hover:text-gray-600' 
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                        title={isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More Button - if you want to implement pagination */}
      {filteredItems.length > 0 && (
        <div className="text-center pt-6">
          <p className="text-sm text-gray-500">
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2">
                • {unreadCount} unread
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsAnnouncements;
