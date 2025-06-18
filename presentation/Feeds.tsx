import React from "react";
import { View, FlatList, Text, Image, StyleSheet } from "react-native";
import { Button, Icon } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";

const mockPins = [
  {
    id: 1,
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    title: "Beautiful Mountain",
    description: "A scenic view of a mountain.",
  },
  {
    id: 2,
    image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
    title: "Serene Lake",
    description: "A calm lake surrounded by trees.",
  },
  {
    id: 3,
    image_url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
    title: "City Lights",
    description: "A city skyline at night.",
  },
];

export default function Feeds() {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: (typeof mockPins)[0] }) => (
    <View style={styles.pinContainer}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={mockPins}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <View style={styles.navBar}>
        <Button
          type="clear"
          icon={<Icon name="home" type="feather" color="#333" size={28} />}
          title="Home"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />
        <Button
          type="clear"
          icon={<Icon name="search" type="feather" color="#333" size={28} />}
          title="Search"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />
        <Button
          type="clear"
          icon={
            <Icon name="plus-circle" type="feather" color="#333" size={28} />
          }
          title="Create"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => navigation.navigate("PinUpload")}
        />
        <Button
          type="clear"
          icon={<Icon name="user" type="feather" color="#333" size={28} />}
          title="Profile"
          titleStyle={styles.navTitle}
          containerStyle={styles.navButton}
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  pinContainer: {
    marginBottom: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#555",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
  },
  navTitle: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },
});
