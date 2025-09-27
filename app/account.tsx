import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = 'builder_city_username';

export default function AccountScreen() {
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      const name = savedUsername || 'Username';
      setUsername(name);
      setOriginalUsername(name);
    } catch (error) {
      console.error('Error loading username:', error);
      setUsername('Username');
      setOriginalUsername('Username');
    } finally {
      setLoading(false);
    }
  };

  const saveUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a valid username');
      return;
    }

    if (username.trim() === originalUsername) {
      Alert.alert('Info', 'No changes to save');
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem(USERNAME_KEY, username.trim());
      setOriginalUsername(username.trim());
      Alert.alert('Success', 'Username saved successfully!');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to save username. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const hasChanges = username.trim() !== originalUsername;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#000000" translucent={false} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          </View>

          {/* Username Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your username"
                placeholderTextColor="#a1a1a1"
                value={username}
                onChangeText={setUsername}
                maxLength={30}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={saveUsername}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!hasChanges || saving || loading) && styles.saveButtonDisabled
            ]}
            onPress={saveUsername}
            disabled={!hasChanges || saving || loading}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    letterSpacing: -0.32,
    lineHeight: 24,
    textAlign: 'center',
    flex: 1,
    marginRight: 56, // Compensate for back button width
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#3b3b3b',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  saveButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#3b3b3b',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#050508',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geologica',
    lineHeight: 22,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -67 }],
    width: 134,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 100,
  },
});
