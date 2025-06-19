"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

interface UploadScreenProps {
  navigation?: any;
}

export default function UploadScreen({ navigation }: UploadScreenProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Test network connectivity
  async function testNetworkConnection() {
    try {
      setUploadProgress("Testing connection...");
      const { data, error } = await supabase
        .from("posts")
        .select("count")
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      console.log("Network test successful");
      return true;
    } catch (error: any) {
      console.error("Network test failed:", error);
      throw new Error(
        "Unable to connect to the server. Please check your internet connection."
      );
    }
  }

  async function pickImage() {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  }

  async function uploadImage() {
    if (!image || !title.trim()) {
      Alert.alert("Error", "Please select an image and enter a title");
      return;
    }

    setUploading(true);
    setUploadProgress("Preparing upload...");

    try {
      // Test network connectivity first
      await testNetworkConnection();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user found. Please sign in again.");
      }

      console.log("Starting image upload for user:", user.id);
      setUploadProgress("Uploading image...");

      // Create a more robust filename with proper structure
      const fileExt = image.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `users/${user.id}/posts/${timestamp}_${randomId}.${fileExt}`;

      console.log("Uploading file:", fileName);

      // Convert image to blob for upload with better error handling
      let blob: Blob;
      try {
        const response = await fetch(image);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        blob = await response.blob();

        // Validate blob
        if (blob.size === 0) {
          throw new Error("Image file is empty");
        }

        // Check file size (max 10MB for better performance)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (blob.size > maxSize) {
          throw new Error("Image must be smaller than 10MB");
        }

        console.log("Image blob validated:", {
          size: blob.size,
          type: blob.type,
        });
      } catch (error: any) {
        throw new Error(`Failed to process image: ${error.message}`);
      }

      // Upload image to Supabase Storage with optimized settings
      console.log("Starting Supabase upload...");
      setUploadProgress("Connecting to storage...");

      try {
        // Test Supabase connection first
        const { data: testData, error: testError } = await supabase.storage
          .from("posts")
          .list("", { limit: 1 });

        if (testError) {
          console.error("Storage connection test failed:", testError);
          throw new Error(`Storage connection failed: ${testError.message}`);
        }

        console.log("Storage connection successful, proceeding with upload...");
        setUploadProgress("Uploading to storage...");

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, blob, {
            contentType: blob.type || `image/${fileExt}`,
            cacheControl: "3600", // Cache for 1 hour
            upsert: false, // Don't overwrite existing files
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);

          // Check if it's a network issue
          if (
            uploadError.message.includes("Network") ||
            uploadError.message.includes("fetch") ||
            uploadError.message.includes("Failed to fetch")
          ) {
            throw new Error(
              "Network connection failed. Please check your internet connection and try again."
            );
          }

          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log("Upload successful:", uploadData);
      } catch (networkError: any) {
        console.error("Network/Upload error:", networkError);

        // Provide specific error messages for different scenarios
        if (
          networkError.message.includes("Network request failed") ||
          networkError.message.includes("fetch")
        ) {
          throw new Error(
            "Unable to connect to storage server. Please check your internet connection and try again."
          );
        }

        throw networkError;
      }
      setUploadProgress("Saving post...");

      // Get public URL with better error handling
      const { data: urlData } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        // Clean up uploaded file if URL generation fails
        await supabase.storage.from("posts").remove([fileName]);
        throw new Error("Failed to get public URL for uploaded image");
      }

      // Verify the URL is accessible
      const publicUrl = urlData.publicUrl;
      console.log("Public URL generated:", publicUrl);

      // Save post to database
      const { data: postData, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          image_url: publicUrl,
        })
        .select();

      if (insertError) {
        console.error("Database insert error:", insertError);
        // Try to clean up uploaded file
        await supabase.storage.from("posts").remove([fileName]);
        throw new Error(`Failed to save post: ${insertError.message}`);
      }

      console.log("Post saved successfully:", postData);
      setUploadProgress("Upload complete!");

      // Show success message with options
      Alert.alert(
        "🎉 Upload Successful!",
        `Your post "${title}" has been uploaded successfully and is now visible to everyone!`,
        [
          {
            text: "Upload Another",
            style: "default",
            onPress: () => {
              // Reset form for another upload
              setTitle("");
              setDescription("");
              setImage(null);
              setUploadProgress("");
            },
          },
          {
            text: "View in Feed",
            style: "default",
            onPress: () => {
              // Reset form and navigate to feed
              setTitle("");
              setDescription("");
              setImage(null);
              setUploadProgress("");
              // Navigate to Feed tab if navigation is available
              if (navigation) {
                navigation.navigate("Feed");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Upload process error:", error);
      setUploadProgress("");

      // Provide specific error messages based on the error type
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (
        error.message.includes("Network") ||
        error.message.includes("fetch") ||
        error.message.includes("connection")
      ) {
        errorMessage =
          "Network connection failed. Please check your internet connection and try again.";
      } else if (
        error.message.includes("auth") ||
        error.message.includes("user")
      ) {
        errorMessage = "Authentication error. Please sign in again.";
      } else if (
        error.message.includes("storage") ||
        error.message.includes("upload")
      ) {
        errorMessage =
          "File upload failed. Please try selecting a different image.";
      } else if (
        error.message.includes("size") ||
        error.message.includes("large")
      ) {
        errorMessage =
          "Image file is too large. Please select a smaller image.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
    }
  }

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
        {/* Enhanced Header */}
        <View style={styles.uploadHeader}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>📤</Text>
            </View>
            <Text style={styles.headerTitle}>Upload</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton}>
                <Text style={styles.actionIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickImage}
            disabled={uploading}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷</Text>
                <Text style={styles.imagePlaceholderSubtext}>
                  Tap to select image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Post title *"
                value={title}
                onChangeText={setTitle}
                editable={!uploading}
                maxLength={100}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={styles.characterCounter}>{title.length}/100</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                editable={!uploading}
                maxLength={500}
                returnKeyType="done"
                textAlignVertical="top"
              />
              <Text style={styles.characterCounter}>
                {description.length}/500
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={uploadImage}
              disabled={uploading || !image || !title.trim()}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? "Uploading..." : "Upload Post"}
              </Text>
            </TouchableOpacity>

            {uploading && (
              <View style={styles.progressContainer}>
                <Text style={styles.uploadingText}>{uploadProgress}</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            )}

            {!uploading && (title.trim() || description.trim() || image) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setTitle("");
                  setDescription("");
                  setImage(null);
                  setUploadProgress("");
                }}
              >
                <Text style={styles.clearButtonText}>Clear Form</Text>
              </TouchableOpacity>
            )}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  imagePickerButton: {
    marginBottom: 24,
  },
  selectedImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 16,
    color: "",
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  characterCounter: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  uploadButton: {
    backgroundColor: "#e60023",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  progressContainer: {
    alignItems: "center",
    gap: 8,
  },
  uploadingText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#e60023",
    width: "100%",
    borderRadius: 2,
  },
  clearButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  // Header Styles
  uploadHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e60023",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 20,
    color: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    padding: 16,
  },
});
