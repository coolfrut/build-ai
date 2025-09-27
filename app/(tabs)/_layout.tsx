import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, Image } from 'react-native';

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
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/images/tabs/projects.png')} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/images/tabs/calculator.png')} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-builder"
        options={{
          title: 'AI Builder',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/images/tabs/ai_builder.png')} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/images/tabs/scanner.png')} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/images/tabs/settings.png')} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
              }}
            />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
