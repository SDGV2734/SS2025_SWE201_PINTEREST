import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

export default function PinUploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", // use string literal as per new API
      allowsEditing: true,
      aspect: [4, 5], // Pinterest-like aspect ratio
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadPin = async () => {
    if (!image) {
      Alert.alert("Please select an image first");
      return;
    }

    try {
      setUploading(true);

      // Use a safe file extension and unique file name
      const fileExt = "jpg"; // or "png" if you want to support PNGs
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;
      const filePath = `pins/${fileName}`;

      // Convert image to blob
      const response = await fetch(image);
      const blob = await response.blob();

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("image-upload-dump")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("image-upload-dump")
        .getPublicUrl(filePath);

      // Insert record into pins table
      const { error } = await supabase
        .from("pins")
        .insert([
          {
            image_url: urlData.publicUrl,
            title,
            description,
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert("Success", "Pin uploaded successfully!");
      setImage(null);
      setTitle("");
      setDescription("");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "An unknown error occurred.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Pin</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to select an image</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={uploadPin}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Pin</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 4 / 5, // Pinterest-like aspect ratio
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  placeholderText: {
    color: "#888",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  uploadButton: {
    backgroundColor: "#e60023", // Pinterest red
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});