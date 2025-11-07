import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffce00',
          tabBarInactiveTintColor: '#a1a1a1',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 90 : 60,
            paddingBottom: Platform.OS === 'ios' ? 34 : 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
            borderWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '400',
            fontFamily: 'Geologica',
            letterSpacing: -0.32,
            lineHeight: 14.4,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-builder"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
    </View>
  );
}
