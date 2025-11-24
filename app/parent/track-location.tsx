import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRouter } from "expo-router";
import { locationService, UserLocation } from "@/services/locationService";
import { userService } from "@/services/userService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export default function TrackLocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentLocation, setStudentLocation] = useState<UserLocation | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  useEffect(() => {
    if (studentId) {
      // Subscribe to location updates
      const unsubscribe = locationService.subscribeToUserLocation(
        studentId,
        (location) => {
          setStudentLocation(location);
        }
      );

      return () => unsubscribe();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      // Get linked student (in a real app, this would be from parent's linked students)
      // For now, we'll get the first student from the database
      // In production, implement proper parent-student linking
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("parentId", "==", "current_parent_id") // This should be the parent's ID
      );

      const snapshot = await getDocs(studentsQuery);
      if (!snapshot.empty) {
        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        setStudentId(studentDoc.id);
        setStudentName(studentData.name || "Student");

        // Get initial location
        const location = await locationService.getUserLocation(studentDoc.id);
        setStudentLocation(location);
      } else {
        Alert.alert(
          "No Student Linked",
          "Please link a student account to track location"
        );
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      Alert.alert("Error", "Failed to load student location");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  if (!studentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Track Location</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>Location not available</Text>
          <Text style={styles.emptySubtext}>
            The student's location is not being shared or is unavailable
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track {studentName}</Text>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: studentLocation.latitude,
          longitude: studentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: studentLocation.latitude,
            longitude: studentLocation.longitude,
          }}
          title={studentName}
          description={studentLocation.address || "Current location"}
          pinColor="red"
        />
      </MapView>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Location</Text>
        {studentLocation.address && (
          <Text style={styles.infoAddress}>{studentLocation.address}</Text>
        )}
        <Text style={styles.infoCoordinates}>
          {studentLocation.latitude.toFixed(6)}, {studentLocation.longitude.toFixed(6)}
        </Text>
        <Text style={styles.infoTime}>
          Last updated: {studentLocation.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  infoAddress: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  infoCoordinates: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  infoTime: {
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});





