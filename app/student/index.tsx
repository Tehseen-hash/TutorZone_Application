import React from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
export default function StudentDashboard() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>🎓 Student Dashboard</Text>
      <Button title="Go Back" onPress={() => router.push("/")} />
    </View>
  );
}
