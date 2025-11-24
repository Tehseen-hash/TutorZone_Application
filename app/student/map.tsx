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
import { locationService, KPK_BOUNDS } from "@/services/locationService";
import { userService, TutorProfile } from "@/services/userService";
import { auth } from "@/firebaseConfig";

interface TutorMarker {
  tutor: TutorProfile;
  location: { latitude: number; longitude: number };
}

export default function MapScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [tutorMarkers, setTutorMarkers] = useState<TutorMarker[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);

      // Get current user location
      if (auth.currentUser) {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          setUserLocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
          // Update location in Firestore
          await locationService.updateUserLocation(currentLocation);
        }
      }

      // Get all tutors with locations in KPK
      const tutorsWithLocations = await locationService.getTutorsInKPK();
      const tutorsData: TutorMarker[] = [];

      for (const item of tutorsWithLocations) {
        const tutor = await userService.getTutorProfile(item.tutorId);
        if (tutor) {
          tutorsData.push({
            tutor,
            location: {
              latitude: item.location.latitude,
              longitude: item.location.longitude,
            },
          });
        }
      }

      setTutorMarkers(tutorsData);
    } catch (error) {
      Alert.alert("Error", "Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>KPK Tutors Map</Text>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || KPK_BOUNDS.center.latitude,
          longitude: userLocation?.longitude || KPK_BOUNDS.center.longitude,
          latitudeDelta: 1.5,
          longitudeDelta: 1.5,
        }}
        region={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              }
            : undefined
        }
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Tutor markers */}
        {tutorMarkers.map((marker) => (
          <Marker
            key={marker.tutor.uid}
            coordinate={marker.location}
            title={marker.tutor.name}
            description={`${marker.tutor.subjects.length} subjects • $${marker.tutor.hourlyRate || 0}/hr`}
            pinColor="green"
            onPress={() => setSelectedTutor(marker.tutor)}
          />
        ))}
      </MapView>

      {selectedTutor && (
        <View style={styles.tutorCard}>
          <View style={styles.tutorCardHeader}>
            <Text style={styles.tutorName}>{selectedTutor.name}</Text>
            <TouchableOpacity
              onPress={() => setSelectedTutor(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          {selectedTutor.rating && (
            <Text style={styles.tutorRating}>
              ⭐ {selectedTutor.rating.toFixed(1)}
            </Text>
          )}
          {selectedTutor.hourlyRate && (
            <Text style={styles.tutorRate}>
              ${selectedTutor.hourlyRate}/hour
            </Text>
          )}
          <View style={styles.tutorActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                router.push({
                  pathname: "/student/tutor-profile",
                  params: { tutorId: selectedTutor.uid },
                });
              }}
            >
              <Text style={styles.actionButtonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => {
                router.push({
                  pathname: "/student/chat",
                  params: { userId: selectedTutor.uid },
                });
              }}
            >
              <Text style={[styles.actionButtonText, styles.chatButtonText]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  tutorCard: {
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
  tutorCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  tutorRating: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
    marginBottom: 4,
  },
  tutorRate: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginBottom: 12,
  },
  tutorActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chatButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  chatButtonText: {
    color: "#6366f1",
  },
});





