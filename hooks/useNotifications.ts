import NotificationService from '@/utils/notificationService';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize notification service
    NotificationService.initialize();

    // Listen for notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle notification tap - you can add navigation logic here
      if (data?.assignmentId) {
        console.log(`User tapped notification for assignment ${data.assignmentId}`);
        // Example: navigate to assignment details
        // router.push(`/assignment/${data.assignmentId}`);
      }
    });

    // Cleanup expired notifications on app start
    NotificationService.cleanupExpiredNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    scheduleAssignmentNotifications: (assignmentId: number, courseId: number, assignmentName: string, courseName: string, dueDate: Date) => 
      NotificationService.scheduleAllAssignmentNotifications(assignmentId, courseId, assignmentName, courseName, dueDate),
    cancelAssignmentNotifications: (assignmentId: number) => 
      NotificationService.cancelAssignmentNotifications(assignmentId),
    getSettings: () => NotificationService.getSettings(),
    saveSettings: (settings: any) => NotificationService.saveSettings(settings),
    sendTestNotification: (title: string, body: string, data?: any) => NotificationService.sendImmediateNotification(title, body, data),
  };
}
