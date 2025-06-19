"use client";

import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import AuthNavigator from "./navigation/AuthNavigator";
import FeedScreen from "./screens/FeedScreen";
import UploadScreen from "./screens/UploadScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { Text, View, ActivityIndicator } from "react-native";

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", !!session);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, !!session, session?.user?.id);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#e60023" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show auth screens if no session
  if (!session) {
    console.log("No session found, showing auth screens");
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Show main app if user is signed in
  console.log("Session found, showing main app");
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#e60023",
          tabBarInactiveTintColor: "#999",
          headerStyle: {
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
            color: "#333",
          },
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            paddingBottom: 20, // Increased from 8 to 20 for more bottom spacing
            paddingTop: 10, // Increased from 8 to 10
            height: 85, // Increased from 70 to 85 to accommodate more padding
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 6, // Increased from 4 to 6 for better spacing
          },
          tabBarIconStyle: {
            marginTop: 6, // Increased from 4 to 6
          },
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: focused ? "#e60023" : "#f8f8f8", // Better contrast
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  minWidth: 44,
                  alignItems: "center",
                  shadowColor: focused ? "#e60023" : "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: focused ? 0.3 : 0.1,
                  shadowRadius: 2,
                  elevation: focused ? 3 : 1,
                }}
              >
                <Text
                  style={{
                    color: focused ? "#fff" : "#333", // Better contrast - white on focused, dark on unfocused
                    fontSize: 10, // Increased from 22 to 24
                    fontWeight: focused ? "bold" : "normal",
                  }}
                >
                  🏠
                </Text>
              </View>
            ),
            title: "Home",
            headerShown: false, // Feed has its own custom header
          }}
        />
        <Tab.Screen
          name="Upload"
          component={UploadScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: focused ? "#e60023" : "#f8f8f8", // Better contrast
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  minWidth: 44,
                  alignItems: "center",
                  shadowColor: focused ? "#e60023" : "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: focused ? 0.3 : 0.1,
                  shadowRadius: 2,
                  elevation: focused ? 3 : 1,
                }}
              >
                <Text
                  style={{
                    color: focused ? "#fff" : "#333", // Better contrast - white on focused, dark on unfocused
                    fontSize: 10, // Increased from 22 to 24
                    fontWeight: focused ? "bold" : "normal",
                  }}
                >
                  ➕
                </Text>
              </View>
            ),
            title: "Upload",
            headerShown: false, // Upload has its own custom header
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: focused ? "#e60023" : "#f8f8f8", // Better contrast
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  minWidth: 44,
                  alignItems: "center",
                  shadowColor: focused ? "#e60023" : "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: focused ? 0.3 : 0.1,
                  shadowRadius: 2,
                  elevation: focused ? 3 : 1,
                }}
              >
                <Text
                  style={{
                    color: focused ? "#fff" : "#333", // Better contrast - white on focused, dark on unfocused
                    fontSize: 10, // Increased from 22 to 24
                    fontWeight: focused ? "bold" : "normal",
                  }}
                >
                  👤
                </Text>
              </View>
            ),
            title: "Profile",
            headerTitle: "My Profile",
            headerShown: false, // Profile has its own custom header
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
