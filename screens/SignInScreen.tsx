"use client"

import { useState, useEffect } from "react"
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from "react-native"
import { supabase } from "../lib/supabase"

interface SignInScreenProps {
  navigation: any
  route?: any
}

export default function SignInScreen({ navigation, route }: SignInScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Pre-fill email if coming from signup
  useEffect(() => {
    if (route?.params?.prefillEmail) {
      setEmail(route.params.prefillEmail)
    }
  }, [route?.params?.prefillEmail])

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      console.log("Attempting to sign in with email:", email.trim())

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log("Sign in response:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
      })

      if (error) {
        console.error("Sign in error details:", error)

        if (error.message.includes("Invalid login credentials")) {
          Alert.alert(
            "Sign In Failed",
            "The email or password you entered is incorrect. Please check your credentials and try again.\n\nIf you just created your account, make sure you're using the exact same password you set during signup.",
            [
              { text: "Try Again", style: "default" },
              {
                text: "Reset Password",
                style: "default",
                onPress: () => resetPassword(),
              },
            ],
          )
        } else if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Confirmed",
            "Please check your email and click the confirmation link before signing in.",
            [
              { text: "OK", style: "default" },
              {
                text: "Resend Email",
                style: "default",
                onPress: () => resendConfirmation(),
              },
            ],
          )
        } else if (error.message.includes("Too many requests")) {
          Alert.alert("Too Many Attempts", "Please wait a few minutes before trying again.")
        } else {
          Alert.alert("Error", `Sign in failed: ${error.message}`)
        }
      } else if (data?.user && data?.session) {
        console.log("Sign in successful!")
        // Clear form on success
        setEmail("")
        setPassword("")
      }
    } catch (error: any) {
      console.error("Sign in exception:", error)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address first")
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())

      if (error) {
        Alert.alert("Error", error.message)
      } else {
        Alert.alert("Password Reset", "Check your email for password reset instructions.")
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to send password reset email.")
    }
  }

  async function resendConfirmation() {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address first")
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      })

      if (error) {
        Alert.alert("Error", error.message)
      } else {
        Alert.alert("Email Sent", "Check your email for the confirmation link.")
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to resend confirmation email.")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your Pinterest account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordButton} onPress={resetPassword} disabled={loading}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("SignUp")} disabled={loading}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
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
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
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
  button: {
    backgroundColor: "#e60023",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordButton: {
    alignItems: "center",
    padding: 8,
  },
  forgotPasswordText: {
    color: "#e60023",
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
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
})
