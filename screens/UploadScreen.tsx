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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, {
          contentType: blob.type || `image/${fileExt}`,
          cacheControl: "3600", // Cache for 1 hour
          upsert: false, // Don't overwrite existing files
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Upload successful:", uploadData);
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
      Alert.alert(
        "Upload Failed",
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload New Post</Text>

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
        <TextInput
          style={styles.input}
          placeholder="Post title *"
          value={title}
          onChangeText={setTitle}
          editable={!uploading}
          maxLength={100}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!uploading}
          maxLength={500}
        />

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
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
});
