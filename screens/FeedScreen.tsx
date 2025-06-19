"use client";

import { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Post, Comment } from "../types";

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    getCurrentUser();
    fetchPosts();
  }, []);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, full_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts =
        data?.map((post) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
          is_liked:
            post.likes?.some((like: any) => like.user_id === currentUserId) ||
            false,
        })) || [];

      setPosts(postsWithCounts);
      setLastRefresh(new Date());
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(postId: string) {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: currentUserId });
      }

      fetchPosts();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function togglePin(postId: string) {
    try {
      const { data: existingPin } = await supabase
        .from("pins")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .single();

      if (existingPin) {
        await supabase
          .from("pins")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
        Alert.alert("Success", "Post unpinned!");
      } else {
        await supabase
          .from("pins")
          .insert({ post_id: postId, user_id: currentUserId });
        Alert.alert("Success", "Post pinned!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function fetchComments(postId: string) {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles (username, full_name)
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingComments(false);
    }
  }

  async function addComment() {
    if (!newComment.trim() || !selectedPost) return;

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: selectedPost.id,
        user_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchComments(selectedPost.id);
      fetchPosts();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  function openComments(post: Post) {
    setSelectedPost(post);
    fetchComments(post.id);
  }

  function closeComments() {
    setSelectedPost(null);
    setComments([]);
    setNewComment("");
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      // Get the current post count before refresh
      const previousPostCount = posts.length;

      // Fetch the latest posts
      await fetchPosts();

      // Update last refresh time
      setLastRefresh(new Date());

      // Check if there are new posts after refresh
      setTimeout(() => {
        const newPostCount = posts.length;
        if (newPostCount > previousPostCount) {
          const newPostsCount = newPostCount - previousPostCount;
          Alert.alert(
            "Fresh Content! 🎉",
            `Found ${newPostsCount} new ${
              newPostsCount === 1 ? "post" : "posts"
            }!`,
            [{ text: "Great!", style: "default" }]
          );
        }
      }, 500); // Small delay to ensure state is updated
    } catch (error) {
      Alert.alert(
        "Refresh Failed",
        "Unable to get the latest content. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  }

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.profiles?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{item.profiles?.username}</Text>
        </View>
      </View>

      <Image source={{ uri: item.image_url }} style={styles.postImage} />

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.postDescription}>{item.description}</Text>
        )}
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(item.id)}
        >
          <Text style={[styles.actionText, item.is_liked && styles.liked]}>
            ❤️ {item.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openComments(item)}
        >
          <Text style={styles.actionText}>💬 {item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => togglePin(item.id)}
        >
          <Text style={styles.actionText}>📌 Pin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.feedHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🏠</Text>
          </View>
          <Text style={styles.feedTitle}>Home</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Text style={styles.actionIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.lastRefreshText}>
          Last updated:{" "}
          {lastRefresh.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e60023"
            title="Pull to refresh..."
            titleColor="#666"
            colors={["#e60023"]} // Android
            progressBackgroundColor="#fff" // Android
          />
        }
      />

      <Modal visible={!!selectedPost} animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={closeComments}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingComments ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyCommentsContainer}>
              <Text style={styles.emptyCommentsIcon}>💬</Text>
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to comment!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.commentsContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {comment.profiles?.username?.charAt(0).toUpperCase() ||
                          "?"}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentUser}>
                          {comment.profiles?.username || "Anonymous"}
                        </Text>
                        <Text style={styles.commentTime}>
                          {new Date(comment.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.commentInputContainer}>
            <View style={styles.commentInput}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <Text style={styles.characterCounter}>
                {newComment.length}/500
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled,
              ]}
              onPress={addComment}
              disabled={!newComment.trim()}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  !newComment.trim() && styles.sendButtonTextDisabled,
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
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
  feedHeader: {
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
    marginBottom: 8,
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
  feedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  lastRefreshText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 20,
    color: "#666",
    fontWeight: "bold",
    padding: 8,
    minWidth: 32,
    textAlign: "center",
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyCommentsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCommentsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e60023",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commentAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  commentInput: {
    flexDirection: "column",
    marginBottom: 12,
  },
  characterCounter: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#e60023",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: "flex-end",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: "#999",
  },
});
