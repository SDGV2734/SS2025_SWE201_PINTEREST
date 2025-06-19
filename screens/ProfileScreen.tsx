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
  RefreshControl,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Post, Profile } from "../types";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"posts" | "pinned">("posts");
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
    fetchPinnedPosts();
  }, []);

  async function fetchProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function fetchUserPosts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          likes (id),
          comments (id)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts =
        data?.map((post) => ({
          ...post,
          likes_count: post.likes?.length || 0,
          comments_count: post.comments?.length || 0,
        })) || [];

      setPosts(postsWithCounts);
      setLastRefresh(new Date());
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPinnedPosts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("pins")
        .select(
          `
        *,
        posts (
          *,
          profiles (
            id,
            username,
            full_name
          )
        )
      `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match Post interface
      const transformedPosts =
        data?.map((pin) => ({
          ...pin.posts,
          profiles: pin.posts.profiles,
          is_pinned: true,
          pinned_at: pin.created_at,
        })) || [];

      setPinnedPosts(transformedPosts);
      setLastRefresh(new Date());
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function signOut() {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert("Error", error.message);
              }
            } catch (error: any) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  async function deletePost(postId: string) {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("posts")
              .delete()
              .eq("id", postId);

            if (error) throw error;

            fetchUserPosts();
            Alert.alert("Success", "Post deleted successfully");
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  }

  async function unpinPost(postId: string) {
    Alert.alert("Unpin Post", "Remove this post from your pinned collection?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unpin",
        style: "destructive",
        onPress: async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
              .from("pins")
              .delete()
              .eq("post_id", postId)
              .eq("user_id", user.id);

            if (error) throw error;

            fetchPinnedPosts();
            Alert.alert("Success", "Post unpinned successfully");
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      // Store previous counts to detect new content
      const previousPostCount = posts.length;
      const previousPinnedCount = pinnedPosts.length;

      // Refresh profile data and both tabs
      await Promise.all([fetchProfile(), fetchUserPosts(), fetchPinnedPosts()]);

      // Check for new content after refresh
      setTimeout(() => {
        const newPostCount = posts.length;
        const newPinnedCount = pinnedPosts.length;

        let message = "";
        let hasNewContent = false;

        if (activeTab === "posts" && newPostCount > previousPostCount) {
          const newPosts = newPostCount - previousPostCount;
          message = `Found ${newPosts} new ${
            newPosts === 1 ? "post" : "posts"
          }!`;
          hasNewContent = true;
        } else if (
          activeTab === "pinned" &&
          newPinnedCount > previousPinnedCount
        ) {
          const newPins = newPinnedCount - previousPinnedCount;
          message = `Found ${newPins} new ${newPins === 1 ? "pin" : "pins"}!`;
          hasNewContent = true;
        }

        if (hasNewContent) {
          Alert.alert("Fresh Content! 🎉", message, [
            { text: "Great!", style: "default" },
          ]);
        }
      }, 500);
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
    <TouchableOpacity
      style={styles.postItem}
      onLongPress={() => deletePost(item.id)}
    >
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
  );

  const renderPinnedPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postItem}
      onLongPress={() => unpinPost(item.id)}
    >
      <Image source={{ uri: item.image_url }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.pinnedIndicator}>
          <Text style={styles.pinnedIcon}>📌</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.postAuthor} numberOfLines={1}>
          by @{item.profiles?.username}
        </Text>
      </View>
    </TouchableOpacity>
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
      <View style={styles.profileHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>👤</Text>
          </View>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={signOut}
            >
              <Text style={styles.actionIcon}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.fullName}>{profile?.full_name}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            <Text style={styles.postCount}>{posts.length} posts</Text>
          </View>
        </View>
      </View>

      {/* Last Refresh Info */}
      <View style={styles.refreshInfo}>
        <Text style={styles.lastRefreshText}>
          Last updated:{" "}
          {lastRefresh.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.activeTabText,
            ]}
          >
            My Posts ({posts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "pinned" && styles.activeTab]}
          onPress={() => setActiveTab("pinned")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pinned" && styles.activeTabText,
            ]}
          >
            Pinned ({pinnedPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "posts" ? (
        <>
          <Text style={styles.sectionTitle}>My Posts</Text>
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>
                Start sharing your photos!
              </Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postsGrid}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#e60023"
                  title="Pull to refresh posts..."
                  titleColor="#666"
                  colors={["#e60023"]} // Android
                  progressBackgroundColor="#fff" // Android
                />
              }
            />
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Pinned Posts</Text>
          {pinnedPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pinned posts yet</Text>
              <Text style={styles.emptySubtext}>
                Pin posts you love to save them here!
              </Text>
            </View>
          ) : (
            <FlatList
              data={pinnedPosts}
              renderItem={({ item }) => renderPinnedPost({ item })}
              keyExtractor={(item) => `pinned-${item.id}`}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postsGrid}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#e60023"
                  title="Pull to refresh pins..."
                  titleColor="#666"
                  colors={["#e60023"]} // Android
                  progressBackgroundColor="#fff" // Android
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topNavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Enhanced Header Styles
  profileHeader: {
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
  navTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  refreshInfo: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  lastRefreshText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
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
    backgroundColor: "#e60023",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutIcon: {
    fontSize: 20,
    color: "#fff",
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#e60023",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  pinnedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(230, 0, 35, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  pinnedIcon: {
    fontSize: 12,
    color: "#fff",
  },
  postAuthor: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
});
