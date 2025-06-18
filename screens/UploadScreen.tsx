"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "../lib/supabase"

export default function UploadScreen() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  async function uploadImage() {
    if (!image || !title.trim()) {
      Alert.alert("Error", "Please select an image and enter a title")
      return
    }

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // Create form data for image upload
      const formData = new FormData()
      const filename = `${Date.now()}.jpg`

      formData.append("file", {
        uri: image,
        type: "image/jpeg",
        name: filename,
      } as any)

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from("posts").upload(filename, formData, {
        contentType: "image/jpeg",
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(filename)

      // Save post to database
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        image_url: publicUrl,
      })

      if (insertError) throw insertError

      Alert.alert("Success", "Post uploaded successfully!")

      // Reset form
      setTitle("")
      setDescription("")
      setImage(null)
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload New Post</Text>

      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
            <Text style={styles.imagePlaceholderSubtext}>Tap to select image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Post title *" value={title} onChangeText={setTitle} />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadImage}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>{uploading ? "Uploading..." : "Upload Post"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
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
    color: "#666",
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
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
