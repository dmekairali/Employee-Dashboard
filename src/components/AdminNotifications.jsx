import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Bell, 
  Megaphone,
  Calendar,
  Clock,
  User,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  ExternalLink,
  Loader,
  Upload,
  Download
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const AdminNotifications = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch notifications and announcements
  const { data, loading, error, refresh, lastRefresh } = useNotifications(currentUser);
  const { notifications = [], announcements = [] } = data || {};

  function getInitialFormData() {
    return {
      type: 'info',
      title: '',
      message: '',
      category: 'general',
      isPinned: false,
      isGlobal: true,
      targetRoles: 'all',
      targetDepartments: 'all',
      expiresAt: '',
      actionRequired: false,
      actionText: '',
      actionLink: '',
      attachments: '',
      status: 'Active'
    };
  }

  const roleOptions = [
    'all',
    'Operation',
    'PC',
    'Sales Agent',
    'Medical Representative',
    'HR',
    'Account',
    'Admin'
  ];

  const departmentOptions = [
    'all',
    'Operations',
    'Sales',
    'HR',
    'IT',
    'Finance',
    'Marketing',
    'Admin'
  ];

  const typeOptions = [
    { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800' },
    { value: 'success', label: 'Success', color: 'bg-green-100 text-green-800' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const categoryOptions = [
    'general', 'system', 'feature', 'performance', 'achievement', 
    'team', 'training', 'maintenance', 'security', 'policy'
  ];

  // Get filtered items
  const getFilteredItems = () => {
    let items = selectedTab === 'notifications' ? notifications : announcements;

    if (searchTerm) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      items = items.filter(item => item.status === filterStatus);
    }

    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }

    return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const filteredItems = getFilteredItems();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_NOTIFICATIONS;
      const sheetName = selectedTab === 'notifications' ? 'Notifications' : 'Announcements';
      
      // Prepare data for submission
      const timestamp = editingItem ? editingItem.timestamp : new Date().toISOString();
      const id = editingItem ? editingItem.id : generateId();
      
      let rowData;
      if (selectedTab === 'notifications') {
        rowData = [
          id,
          formData.type,
          formData.title,
          formData.message,
          timestamp,
          currentUser.name,
          formData.category,
          formData.isPinned ? 'TRUE' : 'FALSE',
          formData.isGlobal ? 'TRUE' : 'FALSE',
          formData.targetRoles,
          formData.targetDepartments,
          formData.expiresAt,
          formData.actionRequired ? 'TRUE' : 'FALSE',
          formData.actionText,
          formData.actionLink,
          formData.status
        ];
      } else {
        rowData = [
          id,
          formData.type,
          formData.title,
          formData.message,
          timestamp,
          currentUser.name,
          formData.category,
          formData.isPinned ? 'TRUE' : 'FALSE',
          formData.isGlobal ? 'TRUE' : 'FALSE',
          formData.targetRoles,
          formData.targetDepartments,
          formData.expiresAt,
          formData.actionRequired ? 'TRUE' : 'FALSE',
          formData.actionText,
          formData.actionLink,
          formData.attachments,
          formData.status
        ];
      }

      if (editingItem) {
        // Update existing item
        await updateSheetRow(spreadsheetId, sheetName, editingItem.rowNumber, rowData);
      } else {
        // Add new item
        await appendToSheet(spreadsheetId, sheetName, rowData);
      }

      // Reset form and refresh data
      setFormData(getInitialFormData());
      setShowForm(false);
      setEditingItem(null);
      refresh();

    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Generate unique ID
  const generateId = () => {
    const prefix = selectedTab === 'notifications' ? 'notif-' : 'ann-';
    return prefix + Date.now().toString().slice(-6);
  };

  // Update sheet row
  const updateSheetRow = async (spreadsheetId, sheetName, rowNumber, data) => {
    if (!rowNumber || isNaN(rowNumber)) {
      throw new Error('Invalid row number for update operation');
    }
    
    const endColumn = selectedTab === 'notifications' ? 'P' : 'Q';
    const range = `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`;
    
    console.log('Updating row with range:', range);
    
    const response = await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        range,
        values: [data]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update item: ${errorData.error || response.statusText}`);
    }
    
    return response.json();
  };

  // Append to sheet
  const appendToSheet = async (spreadsheetId, sheetName, data) => {
    console.log('Appending data to sheet:', sheetName);
    
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        sheetName,
        values: [data]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create item: ${errorData.error || response.statusText}`);
    }
    
    return response.json();
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      message: item.message,
      category: item.category,
      isPinned: item.isPinned,
      isGlobal: item.isGlobal,
      targetRoles: Array.isArray(item.targetRoles) ? item.targetRoles.join(',') : item.targetRoles,
      targetDepartments: Array.isArray(item.targetDepartments) ? item.targetDepartments.join(',') : item.targetDepartments,
      expiresAt: item.expiresAt || '',
      actionRequired: item.actionRequired,
      actionText: item.actionText || '',
      actionLink: item.actionLink || '',
      attachments: item.attachments ? JSON.stringify(item.attachments) : '',
      status: item.status
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (item) => {
    if (deleteConfirm !== item.id) {
      setDeleteConfirm(item.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      setSaving(true);
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_NOTIFICATIONS;
      const sheetName = selectedTab === 'notifications' ? 'Notifications' : 'Announcements';
      
      if (!item.rowNumber) {
        console.error('Missing rowNumber for item:', item);
        throw new Error('Cannot delete item: missing row number');
      }
      
      // Update status to 'Deleted' instead of actually deleting the row
      const updatedItem = { ...item, status: 'Deleted' };
      await handleQuickUpdate(updatedItem);
      
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick actions
  const togglePinned = async (item) => {
    const updatedItem = { ...item, isPinned: !item.isPinned };
    await handleQuickUpdate(updatedItem);
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Draft' : 'Active';
    const updatedItem = { ...item, status: newStatus };
    await handleQuickUpdate(updatedItem);
  };

  const handleQuickUpdate = async (updatedItem) => {
    try {
      setSaving(true);
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_NOTIFICATIONS;
      const sheetName = selectedTab === 'notifications' ? 'Notifications' : 'Announcements';
      
      if (!updatedItem.rowNumber) {
        console.error('Missing rowNumber for item:', updatedItem);
        throw new Error('Cannot update item: missing row number');
      }
      
      let rowData;
      if (selectedTab === 'notifications') {
        rowData = [
          updatedItem.id, 
          updatedItem.type, 
          updatedItem.title, 
          updatedItem.message,
          updatedItem.timestamp, 
          updatedItem.author, 
          updatedItem.category,
          updatedItem.isPinned ? 'TRUE' : 'FALSE',
          updatedItem.isGlobal ? 'TRUE' : 'FALSE',
          Array.isArray(updatedItem.targetRoles) ? updatedItem.targetRoles.join(',') : updatedItem.targetRoles,
          Array.isArray(updatedItem.targetDepartments) ? updatedItem.targetDepartments.join(',') : updatedItem.targetDepartments,
          updatedItem.expiresAt || '', 
          updatedItem.actionRequired ? 'TRUE' : 'FALSE',
          updatedItem.actionText || '', 
          updatedItem.actionLink || '', 
          updatedItem.status
        ];
      } else {
        rowData = [
          updatedItem.id, 
          updatedItem.type, 
          updatedItem.title, 
          updatedItem.message,
          updatedItem.timestamp, 
          updatedItem.author, 
          updatedItem.category,
          updatedItem.isPinned ? 'TRUE' : 'FALSE',
          updatedItem.isGlobal ? 'TRUE' : 'FALSE',
          Array.isArray(updatedItem.targetRoles) ? updatedItem.targetRoles.join(',') : updatedItem.targetRoles,
          Array.isArray(updatedItem.targetDepartments) ? updatedItem.targetDepartments.join(',') : updatedItem.targetDepartments,
          updatedItem.expiresAt || '', 
          updatedItem.actionRequired ? 'TRUE' : 'FALSE',
          updatedItem.actionText || '', 
          updatedItem.actionLink || '',
          updatedItem.attachments ? JSON.stringify(updatedItem.attachments) : '',
          updatedItem.status
        ];
      }

      await updateSheetRow(spreadsheetId, sheetName, updatedItem.rowNumber, rowData);
      refresh();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getTypeBadge = (type) => {
    const typeOption = typeOptions.find(opt => opt.value === type);
    return typeOption ? typeOption.color : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading admin data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Admin Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-blue-600" />
            Admin - Notifications & Announcements
          </h2>
          <p className="text-gray-600">
            Manage system notifications and company announcements
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setFormData(getInitialFormData());
              setEditingItem(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New</span>
          </button>
          <button 
            onClick={refresh}
            disabled={saving}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Announcements</p>
              <p className="text-2xl font-bold text-green-600">{announcements.length}</p>
            </div>
            <Megaphone className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {[...notifications, ...announcements].filter(item => item.status === 'Active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pinned Items</p>
              <p className="text-2xl font-bold text-purple-600">
                {[...notifications, ...announcements].filter(item => item.isPinned).length}
              </p>
            </div>
            <Pin className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
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
                  placeholder="Search by title, message, author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Deleted">Deleted</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {typeOptions.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredItems.length === 0 ? (
          <div className="text-center p-8">
            {selectedTab === 'notifications' ? <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" /> : <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'No items match your current filters'
                : `No ${selectedTab} available`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              const isDeleting = deleteConfirm === item.id;
              
              return (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${item.type === 'urgent' ? 'bg-red-100' : item.type === 'warning' ? 'bg-yellow-100' : item.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          <TypeIcon className={`w-4 h-4 ${item.type === 'urgent' ? 'text-red-600' : item.type === 'warning' ? 'text-yellow-600' : item.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(item.type)}`}>
                          {item.type.toUpperCase()}
                        </span>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Active' ? 'bg-green-100 text-green-800' :
                          item.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'Expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                        
                        {item.isPinned && <Pin className="w-4 h-4 text-orange-500" />}
                        
                        <span className="text-xs text-gray-500">ID: {item.id}</span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {item.author}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(item.timestamp)}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                        {item.expiresAt && (
                          <span className="flex items-center text-orange-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Quick Actions */}
                      <button
                        onClick={() => togglePinned(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isPinned ? 'text-orange-600 hover:text-orange-800' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={item.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {item.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.status === 'Active' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={item.status === 'Active' ? 'Set to Draft' : 'Activate'}
                      >
                        {item.status === 'Active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDeleting ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-red-600'
                        }`}
                        title={isDeleting ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingItem ? 'Edit' : 'Create'} {selectedTab === 'notifications' ? 'Notification' : 'Announcement'}
                </h3>
                <button 
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData(getInitialFormData());
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {typeOptions.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title..."
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter detailed message..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles</label>
                  <input
                    type="text"
                    value={formData.targetRoles}
                    onChange={(e) => setFormData({...formData, targetRoles: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="all, Operation, PC, etc. (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Available: {roleOptions.join(', ')}</p>
                </div>

                {/* Target Departments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Departments</label>
                  <input
                    type="text"
                    value={formData.targetDepartments}
                    onChange={(e) => setFormData({...formData, targetDepartments: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="all, Operations, Sales, etc. (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Available: {departmentOptions.join(', ')}</p>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Section */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="actionRequired"
                    checked={formData.actionRequired}
                    onChange={(e) => setFormData({...formData, actionRequired: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="actionRequired" className="text-sm font-medium text-gray-700">
                    Requires Action Button
                  </label>
                </div>

                {formData.actionRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Text</label>
                      <input
                        type="text"
                        value={formData.actionText}
                        onChange={(e) => setFormData({...formData, actionText: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Acknowledge, Register Now, View Details"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Link</label>
                      <input
                        type="url"
                        value={formData.actionLink}
                        onChange={(e) => setFormData({...formData, actionLink: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments (only for announcements) */}
              {selectedTab === 'announcements' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (JSON format)</label>
                  <textarea
                    value={formData.attachments}
                    onChange={(e) => setFormData({...formData, attachments: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='[{"name":"Report.pdf","url":"https://..."}]'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JSON array of objects with "name" and "url" properties
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">
                      Pin to Top
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isGlobal"
                      checked={formData.isGlobal}
                      onChange={(e) => setFormData({...formData, isGlobal: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="isGlobal" className="text-sm font-medium text-gray-700">
                      Global (All Users)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData(getInitialFormData());
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingItem ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
