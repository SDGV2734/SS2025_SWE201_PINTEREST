import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://itjbumsvlcpptnsgyodi.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0amJ1bXN2bGNwcHRuc2d5b2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODU3NDAsImV4cCI6MjA2MTA2MTc0MH0.6S2ZY_BuCY3F-XJWXNsHWe6Elpjc0I0ehmwCOE5vVUk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
