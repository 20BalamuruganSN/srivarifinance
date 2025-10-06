import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700', // Yellow color for active tab
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // White for dark mode, black for light mode
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF', // Dark background for dark mode
          },
          android: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF', // Dark background for dark mode
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="house.fill" 
              color={focused ? '#FFD700' : color} // Yellow when focused
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={focused ? '#FFD700' : color} // Yellow when focused
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="person" 
              size={24} 
              color={focused ? '#FFD700' : color} // Yellow when focused
            />
          )
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: 'Transaction',
          tabBarIcon: ({ color, focused }) => (
               <FontAwesome6 
  name="money-bill-transfer" 
  size={24} 
  color={focused ? '#FFD700' : color}
/>
          )
        }}
      />
  <Tabs.Screen
  name="History"
  options={{
    title: 'History',
    tabBarIcon: ({ color, focused }) => (
    <FontAwesome6 
  name="calendar-check" 
  size={24} 
  color={focused ? '#FFD700' : color}
/>
    )
  }}
/>
    </Tabs>
  );
}