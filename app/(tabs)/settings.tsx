import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = 'builder_city_username';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [username, setUsername] = useState('Username');

  // Reload username when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUsername();
    }, [])
  );

  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your projects and app data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setUsername('Username');
              Alert.alert('Success', 'All data has been deleted successfully.');
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const settingsItems = [
    {
      id: 'downloads',
      title: 'Downloads',
      icon: 'download-outline',
      onPress: () => router.push('/downloads'),
    },
    {
      id: 'account',
      title: 'Account',
      icon: 'person-outline',
      onPress: () => router.push('/account'),
    },
    {
      id: 'terms',
      title: 'Terms of Services',
      icon: 'document-text-outline',
      onPress: () => {
        Alert.alert('Terms of Services', 'This feature will be available in a future update.');
      },
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => {
        Alert.alert('Privacy Policy', 'This feature will be available in a future update.');
      },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      hasToggle: true,
      toggleValue: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: 'delete',
      title: 'Delete All Data',
      icon: 'trash-outline',
      isDestructive: true,
      onPress: handleDeleteAllData,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <Text style={styles.username}>{username}</Text>
        </View>

        {/* Settings Items */}
        <View style={styles.settingsContainer}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingsItem}
              onPress={item.onPress}
              disabled={item.hasToggle}
            >
              <View style={styles.settingsItemLeft}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.isDestructive ? '#ff4656' : '#ffffff'} 
                />
                <Text style={[
                  styles.settingsItemText,
                  item.isDestructive && styles.settingsItemTextDestructive
                ]}>
                  {item.title}
                </Text>
              </View>
              
              {item.hasToggle ? (
                <Switch
                  value={item.toggleValue}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#3b3b3b', true: '#22c55d' }}
                  thumbColor={item.toggleValue ? '#ffffff' : '#a1a1a1'}
                />
              ) : (
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 60, // Space for tab bar
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#3b3b3b',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 20.4,
    letterSpacing: -0.32,
  },
  settingsContainer: {
    gap: 8,
    paddingBottom: 20,
  },
  settingsItem: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 18,
  },
  settingsItemTextDestructive: {
    color: '#ff4656',
  },
});
