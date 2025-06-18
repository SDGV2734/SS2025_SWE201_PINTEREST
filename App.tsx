"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"
import AuthNavigator from "./navigation/AuthNavigator"
import FeedScreen from "./screens/FeedScreen"
import UploadScreen from "./screens/UploadScreen"
import ProfileScreen from "./screens/ProfileScreen"
import { Text, View, ActivityIndicator } from "react-native"

const Tab = createBottomTabNavigator()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", !!session)
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, !!session, session?.user?.id)
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#e60023" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Loading...</Text>
      </View>
    )
  }

  // Show auth screens if no session
  if (!session) {
    console.log("No session found, showing auth screens")
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    )
  }

  // Show main app if user is signed in
  console.log("Session found, showing main app")
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#e60023",
          tabBarInactiveTintColor: "#666",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
            title: "Home",
          }}
        />
        <Tab.Screen
          name="Upload"
          component={UploadScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>➕</Text>,
            title: "Upload",
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
            title: "Profile",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
