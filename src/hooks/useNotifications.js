// src/hooks/useNotifications.js
import { useCachedData } from './useCachedData';
import { useCallback } from 'react';

export const useNotifications = (currentUser) => {
  const fetchNotificationsData = useCallback(async () => {
    try {
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_NOTIFICATIONS;
      const notificationsSheet = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_NOTIFICATIONS || 'Notifications';
      const announcementsSheet = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_ANNOUNCEMENTS || 'Announcements';
      
      if (!spreadsheetId) {
        throw new Error('Notifications spreadsheet configuration is missing');
      }

      const apiUrl = '/api/sheets';
      
      // Fetch notifications
      const notificationsParams = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: notificationsSheet,
        range: 'A2:P' // Skip header row
      });
      
      const notificationsResponse = await fetch(`${apiUrl}?${notificationsParams}`);
      if (!notificationsResponse.ok) {
        throw new Error(`Failed to fetch notifications: ${notificationsResponse.status}`);
      }
      const notificationsData = await notificationsResponse.json();
      
      // Fetch announcements
      const announcementsParams = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: announcementsSheet,
        range: 'A2:Q' // Skip header row
      });
      
      const announcementsResponse = await fetch(`${apiUrl}?${announcementsParams}`);
      if (!announcementsResponse.ok) {
        throw new Error(`Failed to fetch announcements: ${announcementsResponse.status}`);
      }
      const announcementsData = await announcementsResponse.json();
      
      // Process and filter data
      const notifications = processNotifications(notificationsData.values || [], currentUser);
      const announcements = processAnnouncements(announcementsData.values || [], currentUser);
      
      console.log(`Loaded ${notifications.length} notifications and ${announcements.length} announcements for ${currentUser.name}`);
      
      return { notifications, announcements };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }, [currentUser]);

  return useCachedData('notifications', currentUser, fetchNotificationsData);
};

// Process notifications from sheet data
const processNotifications = (rows, currentUser) => {
  return rows
    .filter(row => row && row.length >= 16 && row[15] === 'Active') // Status = Active
    .map((row, index) => {
      try {
        return {
          id: row[0] || `notif-${index}`,
          type: (row[1] || 'info').toLowerCase(),
          title: row[2] || 'Untitled Notification',
          message: row[3] || '',
          timestamp: row[4] || new Date().toISOString(),
          author: row[5] || 'System',
          category: row[6] || 'general',
          isPinned: (row[7] || '').toUpperCase() === 'TRUE',
          isGlobal: (row[8] || '').toUpperCase() === 'TRUE',
          targetRoles: parseCommaSeparated(row[9]),
          targetDepartments: parseCommaSeparated(row[10]),
          expiresAt: row[11] || null,
          actionRequired: (row[12] || '').toUpperCase() === 'TRUE',
          actionText: row[13] || '',
          actionLink: row[14] || '',
          itemType: 'notification',
          rowNumber: index + 2, // +2 because we start from row 2 (after header)
          status: row[15] || 'Active'
        };
      } catch (error) {
        console.error('Error processing notification row:', row, error);
        return null;
      }
    })
    .filter(item => item && isItemForUser(item, currentUser));
};

// Process announcements from sheet data
const processAnnouncements = (rows, currentUser) => {
  return rows
    .filter(row => row && row.length >= 17 && row[16] === 'Active') // Status = Active
    .map((row, index) => {
      try {
        let attachments = [];
        if (row[15]) {
          try {
            attachments = JSON.parse(row[15]);
          } catch (jsonError) {
            console.warn('Invalid JSON in attachments column:', row[15]);
            attachments = [];
          }
        }

        return {
          id: row[0] || `ann-${index}`,
          type: (row[1] || 'info').toLowerCase(),
          title: row[2] || 'Untitled Announcement',
          message: row[3] || '',
          timestamp: row[4] || new Date().toISOString(),
          author: row[5] || 'System',
          category: row[6] || 'general',
          isPinned: (row[7] || '').toUpperCase() === 'TRUE',
          isGlobal: (row[8] || '').toUpperCase() === 'TRUE',
          targetRoles: parseCommaSeparated(row[9]),
          targetDepartments: parseCommaSeparated(row[10]),
          expiresAt: row[11] || null,
          actionRequired: (row[12] || '').toUpperCase() === 'TRUE',
          actionText: row[13] || '',
          actionLink: row[14] || '',
          attachments: attachments,
          itemType: 'announcement',
          rowNumber: index + 2, // +2 because we start from row 2 (after header)
          status: row[16] || 'Active'
        };
      } catch (error) {
        console.error('Error processing announcement row:', row, error);
        return null;
      }
    })
    .filter(item => item && isItemForUser(item, currentUser));
};

// Helper function to parse comma-separated values
const parseCommaSeparated = (value) => {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
};

// Check if an item should be shown to the current user
const isItemForUser = (item, currentUser) => {
  try {
    // Check if expired
    if (item.expiresAt && item.expiresAt.trim() !== '') {
      const expiryDate = new Date(item.expiresAt);
      if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
        return false;
      }
    }
    
    // If global, show to everyone
    if (item.isGlobal) return true;
    
    const userRole = currentUser.role || '';
    const userDepartment = currentUser.department || '';
    
    // Check role targeting
    const roleMatch = item.targetRoles.length === 0 || 
                     item.targetRoles.includes('all') || 
                     item.targetRoles.includes(userRole);
                     
    // Check department targeting
    const deptMatch = item.targetDepartments.length === 0 || 
                     item.targetDepartments.includes('all') || 
                     item.targetDepartments.includes(userDepartment);
    
    return roleMatch && deptMatch;
  } catch (error) {
    console.error('Error filtering item for user:', item, currentUser, error);
    return false;
  }
};

// Hook for managing user's read status
export const useNotificationReadStatus = (currentUser) => {
  const getReadItems = () => {
    try {
      const stored = localStorage.getItem(`readNotifications_${currentUser.name}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading read notifications:', error);
      return new Set();
    }
  };

  const markAsRead = (itemIds) => {
    try {
      const readItems = getReadItems();
      if (Array.isArray(itemIds)) {
        itemIds.forEach(id => readItems.add(id));
      } else {
        readItems.add(itemIds);
      }
      localStorage.setItem(`readNotifications_${currentUser.name}`, JSON.stringify([...readItems]));
      return readItems;
    } catch (error) {
      console.error('Error saving read notifications:', error);
      return getReadItems();
    }
  };

  const markAsUnread = (itemId) => {
    try {
      const readItems = getReadItems();
      readItems.delete(itemId);
      localStorage.setItem(`readNotifications_${currentUser.name}`, JSON.stringify([...readItems]));
      return readItems;
    } catch (error) {
      console.error('Error updating read notifications:', error);
      return getReadItems();
    }
  };

  return {
    getReadItems,
    markAsRead,
    markAsUnread
  };
};
