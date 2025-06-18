"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native"
import { supabase } from "../lib/supabase"
import type { Post, Comment } from "../types"

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    getCurrentUser()
    fetchPosts()
  }, [])

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
  }

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const postsWithCounts =
        data?.map((post) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          is_liked: post.likes?.some((like: any) => like.user_id === currentUserId) || false,
        })) || []

      setPosts(postsWithCounts)
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleLike(postId: string) {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.is_liked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId)
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId })
      }

      fetchPosts()
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function togglePin(postId: string) {
    try {
      const { data: existingPin } = await supabase
        .from("pins")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .single()

      if (existingPin) {
        await supabase.from("pins").delete().eq("post_id", postId).eq("user_id", currentUserId)
        Alert.alert("Success", "Post unpinned!")
      } else {
        await supabase.from("pins").insert({ post_id: postId, user_id: currentUserId })
        Alert.alert("Success", "Post pinned!")
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function fetchComments(postId: string) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (username, full_name)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  async function addComment() {
    if (!newComment.trim() || !selectedPost) return

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: selectedPost.id,
        user_id: currentUserId,
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      fetchComments(selectedPost.id)
      fetchPosts()
    } catch (error: any) {
      Alert.alert("Error", error.message)
    }
  }

  function openComments(post: Post) {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  function closeComments() {
    setSelectedPost(null)
    setComments([])
    setNewComment("")
  }

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.profiles?.username?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{item.profiles?.username}</Text>
        </View>
      </View>

      <Image source={{ uri: item.image_url }} style={styles.postImage} />

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        {item.description && <Text style={styles.postDescription}>{item.description}</Text>}
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id)}>
          <Text style={[styles.actionText, item.is_liked && styles.liked]}>❤️ {item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item)}>
          <Text style={styles.actionText}>💬 {item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => togglePin(item.id)}>
          <Text style={styles.actionText}>📌 Pin</Text>
        </TouchableOpacity>
      </View>
    </View>
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
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />

      <Modal visible={!!selectedPost} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={closeComments}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentsContainer}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentUser}>{comment.profiles?.username}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={addComment}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  feedContainer: {
    padding: 16,
  },
  postContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e60023",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
  },
  postImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: "#666",
  },
  postActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
  liked: {
    color: "#e60023",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 18,
    color: "#666",
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentUser: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  commentText: {
    color: "#666",
  },
  commentInput: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#e60023",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})
