import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button, Icon } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { Session } from "@supabase/supabase-js";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FeedsProps {
  session: Session;
}

const { width: screenWidth } = Dimensions.get("window");
const numColumns = 2;
const columnWidth = (screenWidth - 24) / numColumns; // 24 = padding + gaps

const mockPins = [
  {
    id: 1,
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    title: "Beautiful Mountain",
    description: "A scenic view of a mountain.",
    height: 280,
    width: "large", // Different width variations
    isLiked: false,
    isSaved: false,
  },
  {
    id: 2,
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
    title: "Serene Lake",
    description: "A calm lake surrounded by trees.",
    height: 180,
    width: "small",
    isLiked: false,
    isSaved: false,
  },
  {
    id: 3,
    image_url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
    title: "City Lights",
    description: "A city skyline at night.",
    height: 350,
    width: "medium",
    isLiked: true,
    isSaved: false,
  },
  {
    id: 4,
    image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    title: "Forest Path",
    description: "A peaceful forest trail.",
    height: 240,
    width: "medium",
    isLiked: false,
    isSaved: true,
  },
  {
    id: 5,
    image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    title: "Sunset Beach",
    description: "Golden hour at the beach.",
    height: 200,
    width: "large",
    isLiked: true,
    isSaved: true,
  },
  {
    id: 6,
    image_url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
    title: "Desert Landscape",
    description: "Vast desert under clear skies.",
    height: 160,
    width: "small",
    isLiked: false,
    isSaved: false,
  },
  {
    id: 7,
    image_url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    title: "Tropical Paradise",
    description: "Crystal clear waters and palm trees.",
    height: 300,
    width: "medium",
    isLiked: false,
    isSaved: false,
  },
  {
    id: 8,
    image_url: "https://images.unsplash.com/photo-1464822759844-d150e4da0870",
    title: "Mountain Peak",
    description: "Snow-capped mountain in the distance.",
    height: 220,
    width: "large",
    isLiked: true,
    isSaved: false,
  },
];

export default function Feeds({ session }: Readonly<FeedsProps>) {
  const navigation = useNavigation<NavigationProp>();
  const [pins, setPins] = useState(mockPins);

  const handleLike = (pinId: number) => {
    setPins((prevPins) =>
      prevPins.map((pin) =>
        pin.id === pinId ? { ...pin, isLiked: !pin.isLiked } : pin
      )
    );
  };

  const handleSave = (pinId: number) => {
    setPins((prevPins) =>
      prevPins.map((pin) =>
        pin.id === pinId ? { ...pin, isSaved: !pin.isSaved } : pin
      )
    );

    const pin = pins.find((p) => p.id === pinId);
    if (pin && !pin.isSaved) {
      Alert.alert("Saved!", "Pin saved to your board", [{ text: "OK" }]);
    }
  };

  const getItemWidth = (widthType: string) => {
    switch (widthType) {
      case "small":
        return columnWidth * 0.8;
      case "large":
        return columnWidth * 1.2;
      default:
        return columnWidth;
    }
  };
  const renderMasonryLayout = () => {
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];

    pins.forEach((item, index) => {
      const pinComponent = (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.pinContainer,
            {
              width: getItemWidth(item.width),
              marginBottom: 12,
            },
          ]}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={[styles.image, { height: item.height }]}
            />
            <View style={styles.imageOverlay}>
              <View style={styles.actionButtons}>
                {" "}
                <TouchableOpacity
                  style={[styles.actionButton, styles.likeButton]}
                  activeOpacity={0.8}
                  onPress={() => handleLike(item.id)}
                >
                  <Icon
                    name="heart"
                    type="feather"
                    color={item.isLiked ? "#ff0000" : "#fff"}
                    size={20}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  activeOpacity={0.8}
                  onPress={() => handleSave(item.id)}
                >
                  <Text style={styles.saveButtonText}>
                    {item.isSaved ? "Saved" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>
      );

      // Alternate between left and right columns with some randomness
      if (index % 3 === 0 || index % 5 === 0) {
        rightColumn.push(pinComponent);
      } else {
        leftColumn.push(pinComponent);
      }
    });

    return (
      <View style={styles.masonryContainer}>
        <View style={styles.column}>{leftColumn}</View>
        <View style={styles.column}>{rightColumn}</View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Icon name="bell" type="feather" color="#333" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {renderMasonryLayout()}
      </ScrollView>
      <View style={styles.navBar}>
        <Button
          type="clear"
          icon={<Icon name="home" type="feather" color="#e60023" size={28} />}
          title="Home"
          titleStyle={[styles.navTitle, { color: "#e60023" }]}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />
        <Button
          type="clear"
          icon={<Icon name="search" type="feather" color="#767676" size={28} />}
          title="Search"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />
        <Button
          type="clear"
          icon={
            <Icon name="plus-circle" type="feather" color="#767676" size={28} />
          }
          title="Create"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />{" "}
        <Button
          type="clear"
          icon={<Icon name="user" type="feather" color="#767676" size={28} />}
          title="Profile"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => navigation.navigate("Profile", { session })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fafafa",
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    letterSpacing: -0.5,
  },
  notificationIcon: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 8,
    paddingBottom: 90, // Space for nav bar
  },
  masonryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pinContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 4,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "space-between",
    padding: 12,
    opacity: 0,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  actionButton: {
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
  likeButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButton: {
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
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  textContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#333",
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    opacity: 0.8,
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
  },
  navTitle: {
    fontSize: 11,
    color: "#767676",
    marginTop: 4,
    fontWeight: "500",
  },
});
