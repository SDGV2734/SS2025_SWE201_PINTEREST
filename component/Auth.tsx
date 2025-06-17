import React, { useState } from "react";
import { Alert, StyleSheet, View, Text } from "react-native";
import { supabase } from "../lib/supabase";
import { Button, Input } from "@rneui/themed";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithMagicLink() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "pinterestclone://feeds", 
      },
    });

    if (error) {
      Alert.alert("Error sending magic link", error.message);
    } else {
      Alert.alert("Check your email for the magic link!");
    }
    setLoading(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Sign in with your email</Text>
      <Input
        placeholder="example@mail.com"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
        leftIcon={{ name: "envelope", type: "font-awesome", size: 20, color: "black" }}
        containerStyle={styles.inputContainer}
        inputContainerStyle={styles.inputUnderline}
      />
      <Button
        title="Send Magic Link"
        disabled={loading}
        onPress={signInWithMagicLink}
        loading={loading}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
        icon={{ name: "envelope", type: "font-awesome", size: 20, color: "white" }}
      />
      <Text
        onPress={() => Alert.alert("Navigate to Sign Up")}
        style={{ marginTop: 20, color: "blue", textAlign: "center" }}
      >
        Don't have an account? Sign up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
  },
  inputUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  button: {
    backgroundColor: "red",
    width: "100%",
    maxWidth: 400,
    marginTop: 20,
  },
  buttonTitle: {
    fontWeight: "bold",
  },
});
