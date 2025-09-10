import { useNotifications } from '@/hooks/useNotifications';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { getSettings, saveSettings, sendTestNotification } = useNotifications();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = getSettings();
      setNotificationsEnabled(currentSettings.enabled);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (enabled: boolean) => {
    if (enabled) {
      // Request permission when enabling notifications
      try {
        // Import notification service to trigger permission request
        const NotificationService = (await import('@/utils/notificationService')).default;
        await NotificationService.registerForPushNotifications();
        
        const currentSettings = getSettings();
        await saveSettings({ ...currentSettings, enabled: true });
        setNotificationsEnabled(true);
        Alert.alert(
          'Notifications Enabled',
          'You will now receive notifications about upcoming assignments!'
        );
      } catch (error) {
        console.error('Failed to enable notifications:', error);
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings to receive assignment reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        setNotificationsEnabled(false);
      }
    } else {
      try {
        const currentSettings = getSettings();
        await saveSettings({ ...currentSettings, enabled: false });
        setNotificationsEnabled(false);
      } catch (error) {
        console.error('Failed to save settings:', error);
        Alert.alert('Error', 'Failed to save notification settings');
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification(
        '🔔 Test Notification',
        'This is a test notification from Canvas Blocker!'
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Notification Settings</Text>
      
      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>
              Turn on/off all push notifications
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={updateNotificationSetting}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.testButton, !notificationsEnabled && styles.disabledButton]}
        onPress={handleTestNotification}
        disabled={!notificationsEnabled}
      >
        <Text style={[styles.testButtonText, !notificationsEnabled && styles.disabledText]}>
          Send Test Notification
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  loadingText: {
    fontSize: 16,
  },
});