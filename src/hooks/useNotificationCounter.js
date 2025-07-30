// src/hooks/useNotificationCounter.js
import { useState, useEffect, useCallback } from 'react';
import { useNotifications, useNotificationReadStatus } from './useNotifications';

export const useNotificationCounter = (currentUser) => {
  const [unreadTodayCount, setUnreadTodayCount] = useState(0);
  const { data, loading, refresh } = useNotifications(currentUser);
  const { getReadItems } = useNotificationReadStatus(currentUser);

  const calculateUnreadTodayCount = useCallback(() => {
    if (!data || !currentUser) return 0;

    const { notifications = [], announcements = [] } = data;
    const allItems = [...notifications, ...announcements];
    const readItems = getReadItems();
    
    // Get today's date boundaries
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter items received today and not read
    const unreadTodayItems = allItems.filter(item => {
      try {
        // Check if item was received today
        const itemDate = new Date(item.timestamp);
        const isToday = itemDate >= startOfToday && itemDate < endOfToday;
        
        // Check if item is unread
        const isUnread = !readItems.has(item.id);
        
        // Check if item is active (not expired)
        let isActive = true;
        if (item.expiresAt && item.expiresAt.trim() !== '') {
          const expiryDate = new Date(item.expiresAt);
          if (!isNaN(expiryDate.getTime())) {
            isActive = expiryDate >= new Date();
          }
        }
        
        return isToday && isUnread && isActive && item.status === 'Active';
      } catch (error) {
        console.error('Error filtering notification item:', item, error);
        return false;
      }
    });

    console.log(`📊 Notification Counter: ${unreadTodayItems.length} unread items received today`, {
      totalItems: allItems.length,
      readItemsCount: readItems.size,
      todayItems: allItems.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= startOfToday && itemDate < endOfToday;
      }).length,
      unreadTodayCount: unreadTodayItems.length
    });

    return unreadTodayItems.length;
  }, [data, currentUser, getReadItems]);

  // Update count when data or read status changes
  useEffect(() => {
    const count = calculateUnreadTodayCount();
    setUnreadTodayCount(count);
  }, [calculateUnreadTodayCount]);

  // Refresh count when read status changes (called from NotificationsAnnouncements)
  const refreshCount = useCallback(() => {
    const count = calculateUnreadTodayCount();
    setUnreadTodayCount(count);
    return count;
  }, [calculateUnreadTodayCount]);

  return {
    unreadTodayCount,
    loading,
    refreshCount,
    refresh
  };
};