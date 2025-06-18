import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import Auth from "./service/Auth";
import Feeds from "./presentation/Feeds";
import PinUploadScreen from "./business/imageUpload";
import { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["pinterestclone://"],
  config: {
    screens: {
      Auth: "auth",
      Feeds: "feeds",
    },
  },
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app launch, check for active session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (sign in, sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Listen for deep links (handle magic link)
    const handleDeepLink = async (event: Linking.EventType) => {
      const url = event.url;
      if (url) {
        // Parse url for access_token from fragment (#access_token=...)
        const parsed = Linking.parse(url);
        const fragment = url.split("#")[1];
        if (fragment) {
          const params = new URLSearchParams(fragment);
          const access_token = params.get("access_token");
          if (access_token) {
            try {
              // Restore session from access token
              await supabase.auth.setSession({
                access_token,
                refresh_token: params.get("refresh_token") || "",
              });
              const {
                data: { session },
              } = await supabase.auth.getSession();
              setSession(session);
            } catch (error) {
              console.error("Error restoring session from magic link", error);
            }
          }
        }
      }
    };

    // Subscribe to deep link events
    const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

    // Also handle initial URL on app cold start
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    })();

    return () => {
      listener?.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  if (loading) return null; // Or splash screen

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session?.user ? (
          <>
            <Stack.Screen name="Feeds" component={Feeds} />
            <Stack.Screen name="PinUpload" component={PinUploadScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={Auth} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
