import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { Icon, Button, Input } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import Account from "../service/Account";

interface ProfileProps {
  session: Session;
}

export default function Profile({ session }: Readonly<ProfileProps>) {
  const navigation = useNavigation();
  const [boards, setBoards] = useState([
    { id: 1, name: "Travel Dreams", pinCount: 12, color: "#ff6b6b" },
    { id: 2, name: "Home Decor", pinCount: 8, color: "#4ecdc4" },
    { id: 3, name: "Recipes", pinCount: 15, color: "#45b7d1" },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      const newBoard = {
        id: boards.length + 1,
        name: newBoardName,
        pinCount: 0,
        color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffa726"][
          Math.floor(Math.random() * 5)
        ],
      };
      setBoards([...boards, newBoard]);
      setNewBoardName("");
      setShowCreateModal(false);
      Alert.alert("Success!", "Board created successfully");
    } else {
      Alert.alert("Error", "Please enter a board name");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" type="feather" color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" type="feather" color="#333" size={24} />
        </TouchableOpacity>
      </View>

      <Account session={session} />

      {/* Boards Section */}
      <View style={styles.boardsSection}>
        <View style={styles.boardsHeader}>
          <Text style={styles.sectionTitle}>My Boards</Text>
          <TouchableOpacity
            style={styles.createBoardButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="plus" type="feather" color="#fff" size={20} />
            <Text style={styles.createBoardText}>Create Board</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.boardsGrid}>
          {boards.map((board) => (
            <TouchableOpacity key={board.id} style={styles.boardCard}>
              <View
                style={[styles.boardPreview, { backgroundColor: board.color }]}
              >
                <Icon name="image" type="feather" color="#fff" size={30} />
              </View>
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{board.name}</Text>
                <Text style={styles.boardPinCount}>{board.pinCount} pins</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Create Board Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Board</Text>
            <Input
              placeholder="Board name"
              value={newBoardName}
              onChangeText={setNewBoardName}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                type="outline"
                onPress={() => {
                  setShowCreateModal(false);
                  setNewBoardName("");
                }}
                containerStyle={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreateBoard}
                containerStyle={styles.modalButton}
                buttonStyle={{ backgroundColor: "#e60023" }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  settingsButton: {
    padding: 8,
  },
  boardsSection: {
    padding: 20,
  },
  boardsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  createBoardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e60023",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createBoardText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  boardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  boardCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boardPreview: {
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  boardInfo: {
    padding: 12,
  },
  boardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  boardPinCount: {
    fontSize: 14,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});