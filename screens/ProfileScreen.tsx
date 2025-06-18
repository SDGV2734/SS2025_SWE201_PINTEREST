"use client"

import { useState, useEffect } from "react"
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { supabase } from "../lib/supabase"
import type { Post, Profile } from "../types"

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchUserPosts()
  }, [])

  async function fetchProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error
      setProfile(data)
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function fetchUserPosts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          likes (id),
          comments (id)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const postsWithCounts =
        data?.map((post) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
        })) || []

      setPosts(postsWithCounts)
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert("Error", error.message)
  }

  async function deletePost(postId: string) {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("posts").delete().eq("id", postId)

            if (error) throw error

            fetchUserPosts()
            Alert.alert("Success", "Post deleted successfully")
          } catch (error: any) {
            Alert.alert("Error", error.message)
          }
        },
      },
    ])
  }

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postItem} onLongPress={() => deletePost(item.id)}>
      <Image source={{ uri: item.image_url }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.postStats}>
          <Text style={styles.statText}>❤️ {item.likes_count}</Text>
          <Text style={styles.statText}>💬 {item.comments_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.username?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.fullName}>{profile?.full_name}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            <Text style={styles.postCount}>{posts.length} posts</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Posts</Text>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>Start sharing your photos!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsGrid}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e60023",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  postCount: {
    fontSize: 14,
    color: "#666",
  },
  signOutButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  signOutText: {
    color: "#666",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  postsGrid: {
    padding: 8,
  },
  postItem: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  postOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
  },
  postTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  postStats: {
    flexDirection: "row",
    gap: 12,
  },
  statText: {
    color: "#fff",
    fontSize: 12,
  },
})
