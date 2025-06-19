"use client";

import { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";

interface SignUpScreenProps {
  navigation: any;
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldownTime(seconds);
    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  async function signUpWithEmail() {
    // Check if in cooldown
    if (cooldownTime > 0) {
      Alert.alert(
        "Please Wait",
        `You can try again in ${cooldownTime} seconds.`
      );
      return;
    }

    // Validation
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      try {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username.trim().toLowerCase())
          .single();

        if (existingUser) {
          Alert.alert("Error", "Username is already taken");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("Username check skipped:", error);
      }

      // Sign up user
      console.log("Attempting to sign up user...");
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              full_name: fullName.trim(),
            },
          },
        });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);

        if (signUpError.message.includes("you can only request this after")) {
          const match = signUpError.message.match(/after (\d+) seconds/);
          const seconds = match ? Number.parseInt(match[1]) : 60;
          startCooldown(seconds);
          Alert.alert(
            "Rate Limited",
            `Too many signup attempts. Please wait ${seconds} seconds before trying again.`
          );
        } else if (signUpError.message.includes("User already registered")) {
          Alert.alert(
            "Error",
            "An account with this email already exists. Please sign in instead."
          );
        } else {
          throw signUpError;
        }
        return;
      }

      if (signUpData.user) {
        console.log("User created successfully:", signUpData.user.id);
        console.log(
          "User email confirmed:",
          !!signUpData.user.email_confirmed_at
        );
        console.log("Session exists:", !!signUpData.session);

        // Create profile
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: signUpData.user.id,
                username: username.trim().toLowerCase(),
                full_name: fullName.trim(),
              },
              { onConflict: "id" }
            );

          if (profileError) {
            console.error("Profile creation error:", profileError);
          } else {
            console.log("Profile created successfully");
          }
        } catch (profileError) {
          console.error("Profile creation exception:", profileError);
        }

        // Check if user is automatically signed in
        if (signUpData.session && signUpData.session.access_token) {
          console.log("User automatically signed in with session!");
          // Clear form
          setFullName("");
          setUsername("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");

          // Show welcome message
          Alert.alert(
            "Welcome!",
            `Welcome to Pinterest, ${fullName}! Start exploring and pinning amazing content.`,
            [
              {
                text: "Get Started",
                onPress: () => {
                  console.log("User ready for main app");
                },
              },
            ]
          );
        } else {
          console.log(
            "No session after signup, user needs to sign in manually"
          );

          // Show success message and direct to sign in
          Alert.alert(
            "Account Created Successfully!",
            `Hi ${fullName}! Your account has been created. Please sign in with your email and password to continue.`,
            [
              {
                text: "Sign In Now",
                onPress: () => {
                  // Pre-fill the email on sign in screen
                  setFullName("");
                  setUsername("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  navigation.navigate("SignIn", { prefillEmail: email.trim() });
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert(
        "Error",
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFormDisabled = loading || cooldownTime > 0;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Image Board</Text>
            <Text style={styles.subtitle}>
              Create your account to start pinning
            </Text>
          </View>

          {cooldownTime > 0 && (
            <View style={styles.cooldownBanner}>
              <Text style={styles.cooldownText}>
                ⏱️ Please wait {cooldownTime} seconds before trying again
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, isFormDisabled && styles.inputDisabled]}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isFormDisabled}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, isFormDisabled && styles.inputDisabled]}
                placeholder="Choose a username"
                value={username}
                onChangeText={(text) =>
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                autoCapitalize="none"
                autoComplete="username"
                editable={!isFormDisabled}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={styles.helperText}>
                Only lowercase letters, numbers, and underscores
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, isFormDisabled && styles.inputDisabled]}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isFormDisabled}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, isFormDisabled && styles.inputDisabled]}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isFormDisabled}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={styles.helperText}>At least 6 characters</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, isFormDisabled && styles.inputDisabled]}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isFormDisabled}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isFormDisabled && styles.buttonDisabled]}
              onPress={signUpWithEmail}
              disabled={isFormDisabled}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "Creating Account..."
                  : cooldownTime > 0
                  ? `Wait ${cooldownTime}s`
                  : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("SignIn")}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e60023",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  cooldownBanner: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  cooldownText: {
    color: "#856404",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    color: "#999",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#e60023",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  linkButton: {
    alignItems: "center",
    padding: 16,
  },
  linkText: {
    color: "#666",
    fontSize: 16,
  },
  linkTextBold: {
    color: "#e60023",
    fontWeight: "bold",
  },
});
